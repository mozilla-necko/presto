import { Builds } from '../api/builds.js';
import { Template } from 'meteor/templating';

import './modals.html';

Template.addBuildModal.onRendered(function() {
  $('#build_email').change(buildChecker);
  $('#build_revision').change(buildChecker);
  $('#build_desc').change(buildChecker);
});

Template.addTaskModal.helpers({
  domains() {
    return Meteor.settings.public.top_sites.map(url => {
      return {
        url: url
      };
    });
  }
});

function buildChecker() {
  $('#build_submit').addClass('disabled');
  $('#build_submit').unbind('click');

  let email = $('#build_email').val();
  let revision = $('#build_revision').val();
  let desc = $('#build_desc').val();

  if (!email || !revision || !desc) {
    return;
  }

  let id = encodeURIComponent(email + '-' + revision);
  let url = Meteor.settings.public.build_archive + id + '/';

  makeXHRRequest(url).then(function() {
    // console.log('OK: ' + url);
    $('#build_submit').removeClass('disabled');
    $('#build_submit').click(submit);
  }, function(err) {
    // console.log('NG: ' + url);
  });
}

function makeAlertMessage(type, message) {
  let alert = $('<div />').addClass('alert alert-dismissible')
                          .addClass(type)
                          .attr('role', 'alert')
                          .text(message);
  // dismiss button
  let button = $('<button/>').addClass('close')
                             .attr('data-dismiss', 'alert')
                             .attr('aria-label', 'Close')
                             .append($('<span/>').attr('aria-hidden', 'true')
                                                 .html('&times;'));
  alert.append(button);

  // auto-dismiss
  alert.fadeTo(2000, 500).slideUp(500, function() {
    alert.remove();
  });
  return alert;
}

function submit() {
  let email = $('#build_email').val();
  let revision = $('#build_revision').val();
  let desc = $('#build_desc').val();

  if (!email || !revision || !desc) {
    return;
  }

  let id = encodeURIComponent(email + '-' + revision);
  let text = encodeURIComponent(desc);

  HTTP.get('/api/build/add', {
    params: {
      id: id,
      text: text
    }
  }, (err, resp) => {
    let alert;

    if (err) {
      console.log(err);
      alert = makeAlertMessage('alert-warning', 'Failed');
    } else {
      console.log(resp);
      alert = makeAlertMessage('alert-success', 'Success');
    }

    $('#addBuildAlert').append(alert);
  });
}
