import { check } from 'meteor/check'
import { Mongo } from 'meteor/mongo';
import { Builds, Locations } from './builds.js';
import { Tasks } from './tasks.js';

export const Groups = new Mongo.Collection('groups');

Router.route('/api/groups', {
  where: 'server',
  action: function() {
    this.response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      // 'Access-Control-Allow-Origin': '*'
    });

    let reveal = 0;
    if (this.params.query.reveal) {
      reveal = parseInt(this.params.query.reveal, 10);
    }
    check(reveal, Number);

    let query = {};
    if (!reveal) {
      query['$or'] = [{ hidden: { $exists : false } }, {hidden: { $eq : false }}];
    };

    let builds = Builds.find(query, { sort: { created_at: 1 } }).fetch();
    let tasks = Tasks.find(query, { sort: { created_at: 1 } }).fetch();

    let buildMap = {};
    let responses = [];

    for (let build of builds) {
      let item = {
        owner: build.owner,
        description: build.desc,
        label: build.revision,
        tasks: []
      };
      buildMap[item.label] = item;
      responses.push(item);
    }

    let ungrouped = [];
    for (let task of tasks) {
      let item = {
        id: task.id,
        url: task.url
      };
      if (task.label in buildMap) {
        buildMap[task.label].tasks.push(item);
      } else {
        ungrouped.push(item);
      }
    }
    if (ungrouped.length) {
      responses.push({
        owner: 'N/A',
        description: 'Ungrouped Items',
        label: 'N/A',
        tasks: ungrouped
      });
    }

    this.response.end(JSON.stringify(responses));
  }
});
