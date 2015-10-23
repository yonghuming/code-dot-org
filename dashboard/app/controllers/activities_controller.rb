require 'cdo/regexp'
require 'cdo/geocoder'
require 'cdo/web_purify'

class ActivitiesController < ApplicationController
  include LevelsHelper
  before_filter :authenticate_user!, only: [:script_progress]

  # Given a script_id return the current user's progress
  # for each level in the script
  #
  # @param script_id [String] id of the script
  # @return [JSON]
  # {
  #   'script_id': script_id,
  #   'levels': {
  #     101: 5,
  #     ...
  #   }
  # }
  def script_progress
    script_id = params[:script_id].to_i
    script = Script.get_from_cache(script_id)
    raise ArgumentError, "Invalid script: #{script_id}" unless script

    progress = UserProgress.script_progress(current_user, script)
    render json: {
      script_id: script_id,
      levels: progress
    }
  end

  MIN_LINES_OF_CODE = 0
  MAX_LINES_OF_CODE = 1000

  # Records level progress after each time an attempt is made
  #
  # HTTP METHOD: POST only
  #
  # PATH Params
  # - user_id (required) - The user_id of the user (0 if not signed in)
  # - level_id (optional)
  # - script_level_id (optional)
  # (level_id or script_level_id is required)
  #
  # POST Params
  # - level - the level type (e.g. Custom)
  # - result - whether the level was solved
  # - testResult - maps to Activity.test_result
  # - program - the source of the user's solution
  # - save_to_gallery - whether to create a GalleryActivity
  # - time - how long the user has spent on the level
  # - attempt - attempt number
  # - lines - number of lines of code
  #
  # RETURNS json object containing
  # - design
  # - hint_view_request_url
  # - hint_view_requests
  # - level_id
  # - level_source
  # - level_source_id
  # - message
  # - phone_share_url
  # - script_id
  #
  def milestone
    # Clean up and pull out params
    save_to_gallery = params[:save_to_gallery] == 'true'
    solved = params[:result] == 'true'
    test_result = JSONValue.value(params[:testResult])
    attempt = JSONValue.value(params[:attempt])
    script_level_id = JSONValue.value(params[:script_level_id])
    level_id = JSONValue.value(params[:level_id])
    image = params[:image]
    lines = params[:lines].to_i
    program = params[:program]
    time = params[:time].to_i

    # Figure out what level and script_level we're at
    script_level = ScriptLevel.cache_find(script_level_id.to_i) if script_level_id
    if script_level
      level = script_level.level
    elsif level_id
      level = Level.find(level_id.to_i)
    end

    result = UserProgress.track_level_solution(
      level,
      program,
      image,
      locale,
    )
    level_source = result[:level_source]
    level_source_image = result[:level_source_image]
    share_failure = result[:share_failure]

    lines = [[MIN_LINES_OF_CODE, lines.to_i].max, MAX_LINES_OF_CODE].min if lines
    if current_user && script_level
      result = UserProgress.track_progress_for_user(
        current_user,
        level,
        script_level,
        test_result,
        solved,
        lines,
        attempt,
        save_to_gallery,
        level_source,
        level_source_image,
        time,
      )

      activity = result[:activity]
      new_level_completed = result[:new_level_completed]
      trophy_updates = result[:trophy_updates]

    elsif !current_user
      result = track_progress_in_session(
        level,
        script_level,
        test_result,
      )
      new_level_completed = result[:new_level_completed]
    end

    total_lines = if current_user && current_user.total_lines
                    current_user.total_lines
                  else
                    client_state.lines
                  end

    render json: milestone_response(script_level: script_level,
                                    total_lines: total_lines,
                                    trophy_updates: trophy_updates,
                                    solved?: solved,
                                    level_source: level_source.try(:hidden) ? nil : level_source,
                                    level_source_image: level_source_image,
                                    activity: activity,
                                    new_level_completed: new_level_completed,
                                    share_failure: share_failure)

    slog(:tag => 'activity_finish',
         :script_level_id => script_level.try(:id),
         :level_id => level.id,
         :user_agent => request.user_agent,
         :locale => locale) if solved

    # log this at the end so that server errors (which might be caused by invalid input) prevent logging
    log_milestone(level_source, params, lines)
  end

  private

  def milestone_logger
    @@milestone_logger ||= Logger.new("#{Rails.root}/log/milestone.log")
  end

  def track_progress_in_session(level, script_level, test_result)
    old_result = client_state.level_progress(level.id)

    new_level_completed = !Activity.passing?(old_result) && Activity.passing?(test_result)

    # track scripts
    if script_level.try(:script).try(:id)
      client_state.add_script(script_level.script_id)
    end

    {
      new_level_completed: new_level_completed,
    }
  end

  def log_milestone(level_source, params, lines)
    log_string = 'Milestone Report:'
    if current_user || session.id
      log_string += "\t#{(current_user ? current_user.id.to_s : ('s:' + session.id))}"
    else
      log_string += "\tanon"
    end
    log_string += "\t#{request.remote_ip}\t#{params[:app]}\t#{params[:level]}\t#{params[:result]}" +
                  "\t#{params[:testResult]}\t#{params[:time]}\t#{params[:attempt]}\t#{lines}"
    log_string += level_source.try(:id) ? "\t#{level_source.id}" : "\t"
    log_string += "\t#{request.user_agent}"

    milestone_logger.info log_string
  end
end
