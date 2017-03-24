import { Mongo } from 'meteor/mongo';

export const Tasks = new Mongo.Collection('tasks');

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
