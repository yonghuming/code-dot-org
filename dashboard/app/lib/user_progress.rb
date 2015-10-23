module UserProgress

  # Given a user and a script, returns a hash
  # that maps level_id to best result.
  #
  # @param user [User]
  # @param script [Script]
  # @return [Hash] maps level_id to best result
  def UserProgress.script_progress(user, script)
    user_levels = user.user_levels_by_level(script)
    Hash[user_levels.map { |k, v| [k, v.best_result]}]
  end


  # Stores the level source and image for an attempt
  #
  # @param level [Level] the level to track
  # @param program [String] users solution text
  # @param image [String] base64 encoded image data
  # @param locale [String] current locale
  # @return [Hash]
  # {
  #   level_source: [LevelSource],
  #   level_source_image: [LevelSourceImage],
  #   share_failure: [Hash]
  # }
  #
  def UserProgress.track_level_solution(level, program, image, locale)
    # Validate sharablility of program text and create a level source for it
    if program
      begin
        share_failure = UserProgress.find_share_failure(program, locale)
      rescue OpenURI::HTTPError => share_checking_error
        # If WebPurify fails, the program will be allowed
      end

      level_source = LevelSource.find_identical_or_create(level, program) unless share_failure

      if share_checking_error && level_source
        slog(
          tag: 'share_checking_error',
          error: "#{share_checking_error}",
          level_source_id: level_source.id
        )
      end
    end

    # Store the image only if the image is set, and the image has not been saved
    if image && level_source
      level_source_image = LevelSourceImage.find_by(level_source_id: level_source.id)

      unless level_source_image
        level_source_image = LevelSourceImage.new(level_source_id: level_source.id)
        unless level_source_image.save_to_s3(Base64.decode64(image))
          level_source_image = nil
        end
      end
    end

    {
      level_source: level_source,
      level_source_image: level_source_image,
      share_failure: share_failure
    }
  end

  MAX_INT_MILESTONE = 2147483647
  # Tracks progress of an attempt for a signed in user
  #
  # @param user [User]
  # @param level [Level]
  # @param script_level [ScriptLevel]
  # @param test_result [int]
  # @param solved [bool] whether the solution was correct
  # @param lines [int] the number of lines of code writte
  # @param attempt [int] attempt number
  # @param save_to_gallery [bool] whether to save to gallery
  # @param level_source_image [LevelSourceImage]
  # @param level_source [LevelSource]
  # @param time [int] how long the user spent on the program
  #
  # @returns [Hash]
  # {
  #   activity: [Activity]
  #   new_level_completed: [?],
  #   trophy_updates: [Array]
  # }
  #
  def UserProgress.track_progress_for_user(user, level, script_level, test_result, solved, lines, attempt, save_to_gallery, level_source_image, level_source, time)
    ability = Ability.new user
    ability.authorize! :create, Activity
    ability.authorize! :create, UserLevel

    user.backfill_user_scripts if user.needs_to_backfill_user_scripts?

    activity = Activity.create!(
      user: user,
      level: level,
      action: solved, # TODO I think we don't actually use this. (maybe in a report?)
      test_result: test_result,
      attempt: attempt,
      lines: lines,
      time: [[time, 0].max, MAX_INT_MILESTONE].min,
      level_source_id: level_source.try(:id)
    )

    new_level_completed = user.track_level_progress(script_level, test_result) if script_level

    passed = Activity.passing?(test_result)
    if lines > 0 && passed
      user.total_lines += lines
      # bypass validations/transactions/etc
      User.where(id: user.id).update_all(total_lines: user.total_lines)
    end

    if save_to_gallery && level_source_image && solved
      GalleryActivity.create!(user: user, activity: activity, autosaved: true)
    end

    begin
      trophy_updates = UserProgress.trophy_check(user) if passed && script_level && script_level.script.trophies
    rescue StandardError => e
      Rails.logger.error "Error updating trophy exception: #{e.inspect}"
    end

    {
      activity: activity,
      new_level_completed: new_level_completed,
      trophy_updates: trophy_updates
    }
  end

  # Gives user a trophy if they've earned it
  #
  # @param user [User]
  # @returns [Array] trophies updated
  def UserProgress.trophy_check(user)
    trophy_updates = []
    # called after a new activity is logged to assign any appropriate trophies
    current_trophies = user.user_trophies.includes([:trophy, :concept]).index_by(&:concept)
    progress = user.concept_progress

    progress.each_pair do |concept, counts|
      current = current_trophies[concept]
      pct = counts[:current].to_f/counts[:max]

      new_trophy = Trophy.find_by_id case
        when pct == Trophy::GOLD_THRESHOLD
          Trophy::GOLD
        when pct >= Trophy::SILVER_THRESHOLD
          Trophy::SILVER
        when pct >= Trophy::BRONZE_THRESHOLD
          Trophy::BRONZE
        else
          # "no trophy earned"
      end

      if new_trophy
        if new_trophy.id == current.try(:trophy_id)
          # they already have the right trophy
        elsif current
          current.update_attributes!(trophy_id: new_trophy.id)
          trophy_updates << [data_t('concept.description', concept.name), new_trophy.name, view_context.image_path(new_trophy.image_name)]
        else
          UserTrophy.create!(user: user, trophy_id: new_trophy.id, concept: concept)
          trophy_updates << [data_t('concept.description', concept.name), new_trophy.name, view_context.image_path(new_trophy.image_name)]
        end
      end
    end

    trophy_updates
  end

  USER_ENTERED_TEXT_INDICATORS = ['TITLE', 'TEXT', 'title name\=\"VAL\"']

  # Figures out if we allow the program to be shared
  #
  # @param program [String] the source of the program
  # @param locale [String] users locale
  # @returns [Hash]
  # {
  #   message: [String],
  #   ..
  # }
  def UserProgress.find_share_failure(program, locale)
    return nil unless program.match /(#{USER_ENTERED_TEXT_INDICATORS.join('|')})/

    xml_tag_regexp = /<[^>]*>/
    program_tags_removed = program.gsub(xml_tag_regexp, "\n")

    if email = RegexpUtils.find_potential_email(program_tags_removed)
      return {message: I18n.t('share_code.email_not_allowed'), contents: email, type: 'email'}
    elsif street_address = Geocoder.find_potential_street_address(program_tags_removed)
      return {message: I18n.t('share_code.address_not_allowed'), contents: street_address, type: 'address'}
    elsif phone_number = RegexpUtils.find_potential_phone_number(program_tags_removed)
      return {message: I18n.t('share_code.phone_number_not_allowed'), contents: phone_number, type: 'phone'}
    elsif WebPurify.find_potential_profanity(program_tags_removed, ['en', locale])
      return {message: I18n.t('share_code.profanity_not_allowed'), type: 'profanity'}
    end
    nil
  end
end
