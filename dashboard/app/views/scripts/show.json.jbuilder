script = @script
script_levels = script.script_levels.includes(:script, :stage, level: :game)

levels = script_levels.group_by(&:stage_or_game).map do |stage_or_game, sl_group|
  sl_group = sl_group.sort_by {|sl| sl.stage_or_game_position}
  {title: stage_title(script, stage_or_game), levels: sl_group.map { |sl| sl.level.name }}
end
json.array! levels
