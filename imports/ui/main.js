import { Tasks } from '../api/tasks.js';
import { Template } from 'meteor/templating';

import './main.html';

Template.main.helpers({
  labels() {
    return Meteor.settings.public.labels;
  },

  panes() {
    return [
      { pane: "avg_1st", text: "Average" },
      { pane: "avg_2nd", text: "Average (Cached)" },
      { pane: "med_1st", text: "Median" },
      { pane: "med_2nd", text: "Median (Cached)" },
    ];
  }
});

Template.main.onRendered(function() {
  $('#nav_tabs li a:first').click();
});


let gEnv = {
  cache: {}
};

//*******************
//* Data Operations *
//*******************
function fetchData(label, url) {
  let param = {};
  if (url) param.url = url;
  if (label) param.label = label;

  // console.log('fetchData: ' + JSON.stringify(param));

  let task = Tasks.findOne(param, { sort: {created_at: -1}});
  if (task) {
    return getResult(task.id);
  } else {
    return new Promise((resolve, reject) => {
      reject(JSON.stringify(param) + ' not found');
    })
  }
}

//********************
//* Table Operations *
//********************
function setHeader(thead, names) {
  thead.empty();

  let tr = document.createElement('tr');
  for (let i = 0; i < names.length; i++) {
    let th = document.createElement('th');
    th.textContent = names[i];
    tr.appendChild(th);
  }

  thead.append(tr);
}

function appendRow(body, values) {
  let tr = document.createElement('tr');

  for (let i = 0; i < values.length; i++) {
    let td = document.createElement('td');
    if (typeof(values[i]) == "object") {
      td.appendChild(values[i]);
    } else {
      td.textContent = values[i];
    }
    tr.appendChild(td);
  }

  body.append(tr);
}

function clearTables() {
  setHeader($('#avg_1st_head'), []);
  setHeader($('#avg_2nd_head'), []);
  setHeader($('#med_1st_head'), []);
  setHeader($('#med_2nd_head'), []);
  $('#avg_1st_body').empty();
  $('#avg_2nd_body').empty();
  $('#med_1st_body').empty();
  $('#med_2nd_body').empty();
}

//********************
//* UI Operations *
//********************
function getNameByLabel(label) {
  let labels = Meteor.settings.public.labels;
  for (let obj of labels) {
    if (obj.id == label) {
      return obj.text;
    }
  }
  return null;
}

function createLink(url, text, title) {
  let a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('target', '_blank');
  a.setAttribute('title', title ? title : url);
  a.appendChild(document.createTextNode(text));
  return a;
}

function refreshData() {
  let url = gEnv.url;
  let labels = [];

  if (!gEnv.label) {
    return;
  }
  labels.push(gEnv.label);

  if (gEnv.compare) {
    labels.push(gEnv.compare);
  }

  // console.log('refreshData() Labels: ' + labels);
  // console.log('refreshData() URL: ' + url);

  clearTables();

  let urls = url ? [url] : listDomains();
  // console.log('URLs: ' + JSON.stringify(urls));

  let labelNames = labels.map(getNameByLabel);
  if (labels.length == 1) {
    let name = labelNames[0];

    setHeader($('#avg_1st_head'), ['#', 'URL', name]);
    setHeader($('#avg_2nd_head'), ['#', 'URL', name]);
    setHeader($('#med_1st_head'), ['#', 'URL', name]);
    setHeader($('#med_2nd_head'), ['#', 'URL', name]);

  } else if (labels.length == 2) {
    let names = ['#', 'URL'].concat(labelNames).concat(['Difference', '+']);

    setHeader($('#avg_1st_head'), names);
    setHeader($('#avg_2nd_head'), names);
    setHeader($('#med_1st_head'), names);
    setHeader($('#med_2nd_head'), names);
  }

  let i = 0;
  for (let u of urls) {
    let promises = labels.map(label => {
      return fetchData(label, u);
    });

    Promise.all(promises).then(results => {
      displayData(++i, labels, results);
    }, reason => {
      console.log('error: ' + reason);
    });
  }
}

function displayData(index, labels, results) {
  console.assert(labels.length == results.length);

  let column = $('#column').val();
  // console.log('column = ' + column);
  // console.log(labels);
  // console.log(results);

  let labelNames = labels.map(getNameByLabel);

  if (labelNames.length == 1) {
    let data = results[0];

    appendRow($('#avg_1st_body'), [index, data.url, createLink(data.summary, data.average.firstView[column], data.id)]);
    appendRow($('#avg_2nd_body'), [index, data.url, createLink(data.summary, data.average.repeatView[column], data.id)]);
    appendRow($('#med_1st_body'), [index, data.url, createLink(data.summary, data.median.firstView[column], data.id)]);
    appendRow($('#med_2nd_body'), [index, data.url, createLink(data.summary, data.median.repeatView[column], data.id)]);

  } else if (labelNames.length == 2) {
    let data = results;

    appendRow($('#avg_1st_body'), [
      index,
      data[0].url,
      createLink(data[0].summary, data[0].average.firstView[column], data[0].id),
      createLink(data[1].summary, data[1].average.firstView[column], data[1].id),
      data[0].average.firstView[column] - data[1].average.firstView[column],
      data[0].average.firstView[column] > data[1].average.firstView[column] ? '+' : ''
    ]);

    appendRow($('#avg_2nd_body'), [
      index,
      data[0].url,
      createLink(data[0].summary, data[0].average.repeatView[column], data[0].id),
      createLink(data[1].summary, data[1].average.repeatView[column], data[1].id),
      data[0].average.repeatView[column] - data[1].average.repeatView[column],
      data[0].average.repeatView[column] > data[1].average.repeatView[column] ? '+' : ''
    ]);

    appendRow($('#med_1st_body'), [
      index,
      data[0].url,
      createLink(data[0].summary, data[0].median.firstView[column], data[0].id),
      createLink(data[1].summary, data[1].median.firstView[column], data[1].id),
      data[0].median.firstView[column] - data[1].median.firstView[column],
      data[0].median.firstView[column] > data[1].median.firstView[column] ? '+' : ''
    ]);

    appendRow($('#med_2nd_body'), [
      index,
      data[0].url,
      createLink(data[0].summary, data[0].median.repeatView[column], data[0].id),
      createLink(data[1].summary, data[1].median.repeatView[column], data[1].id),
      data[0].median.repeatView[column] - data[1].median.repeatView[column],
      data[0].median.repeatView[column] > data[1].median.repeatView[column] ? '+' : ''
    ]);
  }
}

displayDomain = function(url) {
  // console.log('displayDomain: ' + url);
  gEnv.url = url;
  refreshData();
}

displayLabel = function(label) {
  // console.log('displayLabel: ' + label);
  gEnv.label = label;
  refreshData();
}

changeColumn = function() {
  refreshData();
}

compareLabel = function(selectObj) {
  let label = selectObj.value;

  // console.log('compareLabel: ' + label);
  gEnv.compare = label;
  refreshData();
}