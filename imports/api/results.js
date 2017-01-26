import { Mongo } from 'meteor/mongo';
import { Tasks } from '../api/tasks.js';

export const Results = new Mongo.Collection('results');

// Router.route('/api/results', {
//   where: 'server',
//   action: function() {
//     this.response.writeHead(200, {
//       'Content-Type': 'application/json; charset=utf-8',
//       'Access-Control-Allow-Origin': '*'
//     });

//     let tasks = Tasks.find({}, { sort: { created_at: 1 } }).fetch();

//     let promises = [];
//     for (let task of tasks) {
//       promises.push(getResult(task.id));
//     }

//     let responses = [];
//     Promise.all(promises).then(results => {
//       for (result of results) {
//         Results.upsert({ id: result.id }, {
//           id: result.id,
//           data: JSON.stringify(result)
//         });
//         responses.push(result.id);
//       }
//       this.response.end(JSON.stringify(responses));
//     });

//   }
// });
