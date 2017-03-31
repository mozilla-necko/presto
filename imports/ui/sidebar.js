import { Template } from 'meteor/templating';

import './sidebar.html';

Template.sidebar.helpers({
  labels() {
    return listBuildLabels();
  }
});

Template.list_label.onRendered(function() {
  $('#cdp-bugs li a').click(function(e) {
    $('#cdp-bugs li').removeClass('active');

    var $parent = $(this).parent();
    if (!$parent.hasClass('active')) {
      $parent.addClass('active');
    }
    e.preventDefault();
  });
});
