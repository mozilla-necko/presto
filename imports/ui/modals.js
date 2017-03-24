import { Builds } from '../api/builds.js';
import { Template } from 'meteor/templating';

import './modals.html';

Template.addBuildModal.onRendered(function() {
  $('#build_email').change(buildChecker);
  $('#build_revision').change(buildChecker);
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

  if (!email || !revision) {
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

function submit() {
  let email = $('#build_email').val();
  let revision = $('#build_revision').val();

  if (!email || !revision) {
    return;
  }

  let id = encodeURIComponent(email + '-' + revision);

  HTTP.get('/api/build/add', {
    params: {
      id: id,
    }
  }, (err, resp) => {
    if (err) {
      console.log(err);
    } else {
      console.log(resp);
      $('#addBuildModal').modal('hide');
    }
  });
}
