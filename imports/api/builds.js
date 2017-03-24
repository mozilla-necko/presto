import { Mongo } from 'meteor/mongo';

export const Builds = new Mongo.Collection('builds');

function addBuild(id) {
  console.log(id);

  let obj = {
    id: id,
    revision: id.substr(id.length - 40),
    owner: id.substr(0, id.length - 41),
    location: 'Necko:Try-' + id.replace('.', '_'),
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
        addBuild(id);

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

    let builds = Builds.find({}, { sort: { created_at: 1 } }).fetch();
    let responses = [];

    for (let build of builds) {
      responses.push({
        id: build.id,
        revision: build.revision,
        owner: build.owner,
        location: build.location,
        created_at: build.created_at
      });
    }

    this.response.end(JSON.stringify(responses));
  }
});
