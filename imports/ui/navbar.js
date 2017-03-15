import { Template } from 'meteor/templating';
import { Tasks } from '../api/tasks.js'

import './navbar.html';

Template.navbar.helpers({
  domains() {
    let urls = [];

    for (let k of listDomains()) {
      urls.push({url: k});
    }

    // console.log('URLs: ' + JSON.stringify(urls));
    return urls;
  },

  numDomains() {
    return listDomains().length;
  }
});

Template.domain.onRendered(function() {
  $('#domains li a').click(function(e) {
    $('#domains li').removeClass('active');

    var $parent = $(this).parent();
    if (!$parent.hasClass('active')) {
      $parent.addClass('active');
    }
    e.preventDefault();
  });

  $('#domains li a:first').click();

  $('#myModal').on('shown.bs.modal', function () {
    $('#myInput').focus()
  })
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
    console.log(resp);
  });
}

Template.addBuildModal.onRendered(function() {
  $('#build_email').change(buildChecker);
  $('#build_revision').change(buildChecker);
});