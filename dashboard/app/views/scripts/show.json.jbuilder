script = @script
script_levels = script.script_levels.includes(:script, :stage, level: :game)

levels = script_levels.group_by(&:stage_or_game)
json.array! levels.each_pair do |stage_or_game, sl_group|
  json.title stage_title(script, stage_or_game)
  sl_group = sl_group.sort_by {|sl| sl.stage_or_game_position}
  json.array! sl_group.each do |sl|
    link = level_info(user, sl)
    sl.assessment
    sl.level.unplugged?
    json.level sl.level_display_text
  end
end
