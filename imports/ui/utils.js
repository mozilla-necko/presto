import { Results } from '../api/results.js';
import { Tasks } from '../api/tasks.js';

sum = function(array) { return array.reduce((a, b) => { return a + b; }, 0); }
avg = function(array) { return array.length ? sum(array) / array.length : 0; }
med = function(array) {
  let m = array.sort((a, b) => { return a - b; });
  let mid = Math.floor((m.length - 1) / 2);
  return m.length % 2 ? m[mid] : (m[mid] + m[mid + 1]) / 2.0;
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
  let urls = Tasks.find({}, {
    sort: { url: 1 }, fields: { url: true }
  }).map((obj) => {
    return obj.url;
  });

  return urls.filter((value, index, self) => {
    return self.indexOf(value) == index;
  });
}

let resultCache = {};

getResult = function(testId) {
  return new Promise(function(resolve, reject) {
    if (resultCache.hasOwnProperty(testId)) {
      resolve(resultCache[testId]);
      return;
    }

    let endpoint = Meteor.settings.public.endpoint;
    let url = endpoint + '/result/' + testId + '/page_data.csv';
    d3.csv(url, (rows) => {
      resolve({
        id: testId,
        data: rows
      });
    });
  });
}
