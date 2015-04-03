require 'test_helper'
require 'rails/performance_test_help'

# Test basic level-page load performance
class LevelPerformanceTest < ActionDispatch::PerformanceTest
  setup do
    # Warm the caches
    first_level = Script.find_by_name(Script::HOC_NAME).stages.first.script_levels.first.level
    first_level.blockly_options
  end

  test "levels show" do
    get '/hoc/1'
  end
end
