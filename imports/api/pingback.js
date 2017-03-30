import { Tasks } from './tasks.js';

function collectResult(id) {
  let endpoint = Meteor.settings.public.endpoint;

  HTTP.get(endpoint + '/results.php', {
    params: {
      test: id,
      f: 'json'
    }
  }, (err, resp) => {
    if (err) { console.log(err); return; }
    let response = resp.data;
    parseResult(response.data);
  });
}

function parseResult(result) {
  if (result.successfulFVRuns == 0 &&
    (result.fvonly || result.successfulRVRuns == 0)) {
    console.log(result.id + ' has skipped (no successful run)');
    return;
  }
  console.log(result.id);

  let browser_name = result.runs[1].firstView.browser_name;
  let browser_version = result.runs[1].firstView.browser_version;

  Tasks.upsert({
    id: result.id,
    url: result.url
  }, {
    id: result.id,
    url: result.url,
    label: result.label,
    browser_name: browser_name,
    browser_version: browser_version,
    created_at: new Date()
  });
}

Router.route('/api/addDomain', {
  where: 'server',
  action: function() {
    this.response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      // 'Access-Control-Allow-Origin': '*'
    });

    let id = this.params.query.id;

    task = Tasks.findOne({ id: id});
    if (!task) {
      collectResult(id);
    }
    this.response.end(id);
  }
});
