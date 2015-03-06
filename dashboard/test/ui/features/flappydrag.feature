Feature: Flappy blocks can be dragged

Background:
  Given I am on "http://learn.code.org/flappy/1?noautoplay=true"

Scenario: Connect two blocks from toolbox
  When I rotate to landscape
  And I wait for a popup
  And I close the popup
  And I drag block "1" to offset "220, 60"
  And I drag block "1" to block "4"
  And I wait for 1 seconds
  Then block "5" is child of block "4"

Scenario: Connect two blocks from toolbox
  And I wait for a popup
  And I close the popup
  And I drag block "1" to offset "220, 60"
  And I drag block "1" to block "4"
  And I wait for 1 seconds
  Then block "5" is child of block "4"
