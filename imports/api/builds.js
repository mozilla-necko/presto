import { Mongo } from 'meteor/mongo';

export const Builds = new Mongo.Collection('builds');
export const Locations = new Mongo.Collection('locations');

function addBuild(id, text) {
  console.log(id);

  let obj = {
    id: id,
    desc: text,
    revision: id.substr(id.length - 40),
    owner: id.substr(0, id.length - 41),
    location: 'Try-' + id.split('.').join('_'),
    created_at: Math.floor(Date.now() / 1000)
  };

  Builds.insert(obj, (err, _id) => {
    if (err) {
      console.log(err);
    } else {
      console.log(_id);
    }
  });
}

Router.route('/api/build/add', {
  where: 'server',
  action: function() {
    let id = decodeURIComponent(this.params.query.id);
    let text = decodeURIComponent(this.params.query.text);
    let url = Meteor.settings.public.build_archive + encodeURIComponent(id) + '/';
    console.log(url);

    let obj = Builds.findOne({id: id});
    if (obj) {
      this.response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        // 'Access-Control-Allow-Origin': '*'
      });

      this.response.end(id + ' exists');
      return;
    }

    HTTP.get(url, {}, (err, resp) => {
      if (err || resp.statusCode != 200) {
        this.response.writeHead(resp.statusCode, {
          'Content-Type': 'text/html; charset=utf-8',
        });
        this.response.end('invalid id: ' + id);
      } else {
        addBuild(id, text);

        this.response.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          // 'Access-Control-Allow-Origin': '*'
        });
        this.response.end('OK');
      }
    });
  }
});

Router.route('/api/builds', {
  where: 'server',
  action: function() {
    this.response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      // 'Access-Control-Allow-Origin': '*'
    });

    let timestamp = 0;
    if (this.params.query.timestamp) {
      timestamp = parseInt(this.params.query.timestamp, 10);
    }
    check(timestamp, Number);

    let reveal = 0;
    if (this.params.query.reveal) {
      reveal = parseInt(this.params.query.reveal, 10);
    }
    check(reveal, Number);

    let query = {};

    if (!reveal) {
      query['$or'] = [{ hidden: { $exists : false } }, {hidden: { $eq : false }}];
    };
    if (timestamp) {
      query.created_at = { $gt : timestamp };
    }
    let builds = Builds.find(query, { sort: { created_at: 1 } }).fetch();
    let responses = [];

    for (let build of builds) {
      let item = {
        id: build.id,
        revision: build.revision,
        owner: build.owner,
        location: build.location,
        created_at: build.created_at
      };
      if (build.url) {
        item.url = build.url;
      }
      responses.push(item);
    }

    this.response.end(JSON.stringify(responses));
  }
});
