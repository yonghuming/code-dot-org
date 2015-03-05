
// TODO: All of this needs to be converted
/*
dashboard.showProjectHeader = function () {
  function projectNameShow() {
    $('.project_name').replaceWith($('<div class="project_name header_text">').text(dashboard.currentApp.name));
    $('.project_save').replaceWith($('<div class="project_edit header_button">').text('<%= I18n.t('project.rename') %>'));
  }

  function projectNameEdit() {
    $('.project_name').replaceWith($('<input type="text" class="project_name header_input">').val(dashboard.currentApp.name));
    $('.project_edit').replaceWith($('<div class="project_save header_button">').text('<%= I18n.t('project.save') %>'));
  }

  var moreButton = '<%= I18n.t('project.more') %> '
      + '<span class="project_more_glyph">&#x25BC;</span>'
      + '<div class="project_more_popup" style="position: absolute;">'
      + '<a href="#"><%= I18n.t('project.delete') %></a><br>'
      + '<a href="#"><%= I18n.t('project.new') %></a></div>';
  $('.project_info').append($('<div class="project_name header_text">').text(dashboard.currentApp.name))
      .append($('<div class="project_edit header_button">').text('<%= I18n.t('project.rename') %>'))
      .append($('<div class="project_share header_button">').text('<%= I18n.t('project.share') %>'))
      .append($('<div class="project_more header_button" style="position: relative;">').html(moreButton));

  projectNameShow();
  $('.freeplay_links').empty().before($('<div class="project_list header_button">').text('<%= I18n.t('project.my_projects') %>'));

  $(document).on('click', '.project_edit', projectNameEdit);

  $(document).on('click', '.project_save', function () {
    $(this).attr('disabled', true);
    dashboard.currentApp.name = $('.project_name').val();
    dashboard.saveProject(function () {
      projectNameShow();
    });
  });

  var $projectMorePopup = $('.project_more_popup');
  function hideProjectMore() {
    $projectMorePopup.hide();
    $('.project_more_glyph').html('&#x25BC;');
    $(document).off('click', hideProjectMore);
  }
  $('.project_more').click(function (e) {
    if ($projectMorePopup.is(':hidden')) {
      e.stopPropagation();
      $projectMorePopup.show();
      $('.project_more_glyph').html('&#x25B2;');
      $(document).on('click', hideProjectMore);
    }
  });
  $projectMorePopup.click(function (e) {
    e.stopPropagation(); // Clicks inside the popup shouldn't close it
  });

  $(document).on('click', '.project_list', function () {
    location.href = '/p'; <%# TODO: Can't call project_list_path because it's not in scope %>
  });
};
*/
