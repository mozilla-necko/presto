import { Results } from '../api/results.js';
import { Tasks } from '../api/tasks.js';

// function sum(array) { return array.reduce((a, b) => { return a + b; }, 0); }
// function avg(array) { return array.length ? sum(array) / array.length : 0; }

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

    // let result = Results.findOne({ id: testId });
    // if (result) {
    //   let data = JSON.parse(result.data);
    //   resultCache[testId] = data;
    //   resolve(data);
    //   return;
    // }

    let endpoint = Meteor.settings.public.endpoint;
    HTTP.get(endpoint + '/results.php', {
      params: {
        test: testId,
        f: 'json'
      }
    }, (err, resp) => {
      if (err) {
        reject(err);
      } else {
        resultCache[testId] = resp.data.data;
        resolve(resp.data.data);
      }
    });
  });
}
