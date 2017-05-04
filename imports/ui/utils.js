import { Builds, Locations } from '../api/builds.js';
import { Tasks } from '../api/tasks.js';

sum = function(array) { return array.reduce((a, b) => { return a + b; }, 0); }
avg = function(array) { return sum(array) / array.length; }
med = function(array) {
  let m = array.sort((a, b) => { return a - b; });
  let mid = Math.floor((m.length - 1) / 2);
  return m.length % 2 ? m[mid] : (m[mid] + m[mid + 1]) / 2.0;
}

unique = function(array) {
  return array.filter((value, index, self) => {
    return self.indexOf(value) == index;
  });
}

makeXHRRequest = function(url) {
  return new Promise(function(resolve, reject) {
    if (!url) {
      reject({
        status: -1,
        statusText: 'invalid url'
      });
      return;
    }
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url);

    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve(this.responseText);
      } else {
        reject({ status: this.status, statusText: xhr.statusText });
      }
    };

    xhr.onerror = function() {
      reject({ status: this.status, statusText: xhr.statusText });
    };

    xhr.send();
  });
}

listDomains = function() {
  let urls = Tasks.find({ $or: [{ hidden: { $exists : false } }, {hidden: { $eq : false }}] }, {
    sort: { url: 1 }, fields: { url: true }
  }).map((obj) => {
    return obj.url;
  });

  return unique(urls);
}

hasLabel = function(label) {
  return Builds.findOne({ revision: label });
}

listBuildLabels = function(param) {
  let labels = Builds.find({}, {
    sort: { desc: 1 }, fields: { desc: true, revision: true }
  }).map(obj => {
    return {
      id: obj.revision,
      text: obj.desc
    }
  });

  labels = unique(labels);

  if (!param || !param.databaseOnly) {
    labels = labels.concat(Meteor.settings.public.labels);
  }

  if (!param || !param.dontFilter) {
    return labels.filter(obj => {
      return Tasks.findOne({
        label: obj.id,
        $or: [{ hidden: { $exists : false } }, {hidden: { $eq : false }}]
      });
    });
  }

  return labels;
}

hasLocation = function(location) {
  return Locations.findOne({ name: location });
}

listLocations = function() {
  let locations = Locations.find({}, { sort: { name: 1 } }).map(obj => {
    return {
      name: obj.name,
      text: obj.text
    };
  });

  return locations;
}

let resultCache = {};

getResult = function(task) {
  let testId = task.id;
  return new Promise(function(resolve, reject) {
    if (resultCache.hasOwnProperty(testId)) {
      resolve(resultCache[testId]);
      return;
    }
    // console.log('cache miss for ' + testId);

    let endpoint = Meteor.settings.public.endpoint;
    let url = endpoint + '/result/' + testId + '/page_data.csv';
    d3.csv(url, (rows) => {
      resultCache[testId] = {
        id: testId,
        data: rows,
        runs: task.runs
      };
      resolve(resultCache[testId]);
    });
  });
}
