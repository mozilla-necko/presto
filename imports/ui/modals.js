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
  },

  labels() {
    return listBuildLabels({ dontFilter: true, databaseOnly: true });
  },

  locations() {
    return listLocations();
  }
});

Template.addTaskModal.onRendered(function() {
  $('#add-task-domains').change(function() {
    let domains = $(this).val();
    let count = domains ? domains.length : 0;
    $('#add-task-domains-count').text(count + ' selected');
  });
  $('#add-task-domains-count').text('0 selected');

  $('#add-task-labels').change(function() {
    let labels = $(this).val();
    let count = labels ? labels.length : 0;
    $('#add-task-labels-count').text(count + ' selected');
  });
  $('#add-task-labels-count').text('0 selected');

  $('#task_submit').click(submitTask);
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
    $('#build_submit').click(submitBuild);
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

function submitBuild() {
  let email = $('#build_email').val();
  let revision = $('#build_revision').val();
  let desc = $('#build_desc').val();

  if (!email || !revision || !desc) {
    return;
  }

  let id = email + '-' + revision;
  let text = desc;

  HTTP.get('/api/build/add', {
    params: {
      id: encodeURIComponent(id),
      text: encodeURIComponent(text)
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

function submitTask() {
  console.log('test');

  let addTaskDomains = $('#add-task-domains').val();
  let addTaskLabels = $('#add-task-labels').val();
  let addTaskLocation = $('#add-task-location').val();
  let addTaskEmail = $('#add-task-email').val();

  if (!addTaskDomains || !addTaskLabels || !addTaskLocation || !addTaskEmail) {
    alert = makeAlertMessage('alert-warning', 'All options are mandatory.');
    $('#addTaskAlert').append(alert);
    return;
  }

  HTTP.get('/api/task/add', {
    params: {
      urls : addTaskDomains.map(s => encodeURIComponent(s)),
      labels : addTaskLabels.map(s => encodeURIComponent(s)),
      location : addTaskLocation,
      user: addTaskEmail
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

    $('#addTaskAlert').append(alert);
  });
}
