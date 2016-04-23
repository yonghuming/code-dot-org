class RemoveLevelFromScriptLevels < ActiveRecord::Migration
  def change
    remove_reference :script_levels, :level
  end
end
