import { check } from 'meteor/check'
import { Mongo } from 'meteor/mongo';
import { Builds, Locations } from './builds.js';

export const Tasks = new Mongo.Collection('tasks');
export const Submissions = new Mongo.Collection('submissions');

Router.route('/api/tasks', {
  where: 'server',
  action: function() {
    this.response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      // 'Access-Control-Allow-Origin': '*'
    });

    let tasks = Tasks.find({}, { sort: { created_at: 1 } }).fetch();
    let responses = [];

    for (let task of tasks) {
      responses.push({
        id: task.id,
        url: task.url,
        label: task.label
      });
    }

    this.response.end(JSON.stringify(responses));
  }
});

function submitOne(url, params) {
  console.log(params);
  return new Promise(function(resolve, reject) {
    HTTP.call("GET", url, {
      params: params,
      timeout: 30000
    }, (err, resp) => {
      if (err || resp.statusCode != 200) {
        reject(err || resp);
      } else {
        resolve(resp.data);
      }
    });
  });
}

function addTask(task) {
  task.subIds = [];
  console.log(task)
  let submissionId = Submissions.insert(task);

  const endpoint = Meteor.settings.public.endpoint + '/runtest.php';
  const location = Locations.findOne({ name: task.location });
  if (!location) {
    console.log('invalid location: %s', task.location);
    return;
  }

  for (let url of task.urls) {
    for (let label of task.labels) {
        let build = Builds.findOne({ revision: label });

        if (!build) {
          console.log('invalid label: %s', label);
          continue;
        }

        submitOne(endpoint, {
          browser_width: task.browser_width,
          browser_height: task.browser_height,
          f: 'json',
          location: [location.name, build.location].join(':'),
          priority: task.priority,
          runs: task.runs,
          url: url,
          pingback: task.pingback,
          label: label
        }).then(resp => {
          let data = resp.data;
          let testId = data.testId;
          console.log(data);
          Submissions.update(submissionId, { $push: { subIds: testId } });
        }, err => {
          console.log('task submission error:');
          console.log(err);
        });
    }
  }
}

Router.route('/api/task/add', {
  where: 'server',
  action: function() {
    try {
      for (let s of this.params.query.labels) { check(s, String); }
      for (let s of this.params.query.urls) { check(s, String); }
      check(this.params.query.location, String);
      check(this.params.query.user, String);
    } catch(e) {
      this.response.writeHead(400, { 'Content-Type': 'html/text; charset=utf-8' });
      this.response.end(JSON.stringify("Invalid Parameters"));
      return;
    }

    let labels = this.params.query.labels.map(decodeURIComponent).filter(hasLabel);
    let urls = this.params.query.urls.map(decodeURIComponent).filter(url => {
      return Meteor.settings.public.top_sites.indexOf(url) != -1;
    });
    let location = decodeURIComponent(this.params.query.location);
    let user = decodeURIComponent(this.params.query.user);

    if (labels && labels.length && labels.length == this.params.query.labels.length &&
        urls && urls.length && urls.length == this.params.query.urls.length &&
        location && hasLocation(location) &&
        user && user.length) {

      addTask({
        browser_width: Meteor.settings.public.browser_width,
        browser_height: Meteor.settings.public.browser_height,
        created_at: new Date(),
        from: this.request.connection.remoteAddress,
        labels: labels,
        location: location,
        pingback: Meteor.settings.public.pingback,
        priority: Meteor.settings.public.priority,
        runs: Meteor.settings.public.runs,
        urls: urls,
        user: user
      });

      this.response.writeHead(200, { 'Content-Type': 'html/text; charset=utf-8' });
      this.response.end("OK");
    } else {
      this.response.writeHead(400, { 'Content-Type': 'html/text; charset=utf-8' });
      this.response.end(JSON.stringify("Invalid Parameters"));
    }
  }
});

