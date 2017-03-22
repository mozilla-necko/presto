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

  let tr = $('<tr/>');
  for (let i = 0; i < names.length; i++) {
    let th = $('<th/>');
    th.text(names[i]);
    tr.append(th);
  }

  thead.append(tr);
}

function appendRow(body, values) {
  let tr = $('<tr/>');

  for (let i = 0; i < values.length; i++) {
    let td = $('<td/>');
    if (typeof(values[i]) == "object") {
      td.append(values[i]);
    } else {
      td.text(values[i]);
    }
    tr.append(td);
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
  if (!text) {
    text = url;
  }
  if (!title) {
    title = text;
  }

  let a = $('<a/>');
  a.attr('href', url);
  a.attr('target', '_blank');
  a.attr('title', title);
  a.append(document.createTextNode(text));
  return a;
}

function createCompareSymbol(value) {
  let arrow = $('<span/>');

  if (value > 0) {
    arrow.addClass('glyphicon glyphicon-triangle-top');
    arrow.css('color', 'red');
  } else if (value < 0) {
    arrow.addClass('glyphicon glyphicon-triangle-bottom');
    arrow.css('color', 'green');
  } else {
    arrow.addClass('glyphicon glyphicon-triangle-right');
    arrow.css('color', 'black');
  }

  return arrow
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

  let firstViewAverageHeader = ['#', 'URL'];
  let secondViewAverageHeader = ['#', 'URL'];
  let firstViewMedianHeader = ['#', 'URL'];
  let secondViewMedianHeader = ['#', 'URL'];

  for (let i in labelNames) {
    firstViewAverageHeader.push(labelNames[i]);
    secondViewAverageHeader.push(labelNames[i]);
    firstViewMedianHeader.push(labelNames[i]);
    secondViewMedianHeader.push(labelNames[i]);

    if (i > 0) {
      firstViewAverageHeader.push('Diff', '+');
      secondViewAverageHeader.push('Diff', '+');
      firstViewMedianHeader.push('Diff', '+');
      secondViewMedianHeader.push('Diff', '+');
    }
  }

  setHeader($('#avg_1st_head'), firstViewAverageHeader);
  setHeader($('#avg_2nd_head'), secondViewAverageHeader);
  setHeader($('#med_1st_head'), firstViewMedianHeader);
  setHeader($('#med_2nd_head'), secondViewMedianHeader);

  let i = 0;
  for (let u of urls) {
    let promises = labels.map(label => {
      return fetchData(label, u);
    });

    Promise.all(promises).then(results => {
      displayData(++i, u, results);
    }, reason => {
      console.log('error: ' + reason);
    });
  }
}

function displayData(index, url, results) {
  console.assert(results.length > 0);
  console.assert(results[0].data);
  console.assert(results[0].data.length > 0);

  let column = $('#column').val();
  // console.log('column = ' + column);
  // console.log(results);

  let values = results.map(result => {
    let { data, id } = result;
    // console.log(result);
    let resultURL = Meteor.settings.public.endpoint + '/results.php?test=' + id;

    let firstViewValues = data.filter((r) => {
      return r['Cached'] == '0';
    }).map((r) => {
      return parseInt(r[column]);
    });
    let repeatViewValues = data.filter((r) => {
      return r['Cached'] == '1';
    }).map((r) => {
      return parseInt(r[column]);
    });

    return {
      id: id,
      url: resultURL,
      firstViewValues: firstViewValues,
      firstViewAverage: avg(firstViewValues).toFixed(2),
      firstViewMedian: med(firstViewValues),
      repeatViewValues: repeatViewValues,
      repeatViewAverage: avg(repeatViewValues).toFixed(2),
      repeatViewMedian: med(repeatViewValues)
    };
  });

  let a = createLink(url);
  let firstViewAverageResults = [index, a.clone()];
  let secondViewAverageResults = [index, a.clone()];
  let firstViewMedianResults = [index, a.clone()];
  let secondViewMedianResults = [index, a.clone()];

  for (let i in values) {
    firstViewAverageResults.push(createLink(values[i].url, values[i].firstViewAverage, values[i].id));
    secondViewAverageResults.push(createLink(values[i].url, values[i].repeatViewAverage, values[i].id));
    firstViewMedianResults.push(createLink(values[i].url, values[i].firstViewMedian, values[i].id));
    secondViewMedianResults.push(createLink(values[i].url, values[i].repeatViewMedian, values[i].id));

    if (i > 0) {
      let firstViewAverageDiff = (values[i - 1].firstViewAverage - values[i].firstViewAverage).toFixed(2);
      let repeatViewAverageDiff = (values[i - 1].repeatViewAverage - values[i].repeatViewAverage).toFixed(2);
      let firstViewMedianDiff = (values[i - 1].firstViewMedian - values[i].firstViewMedian).toFixed(2);
      let repeatViewMedianDiff = (values[i - 1].repeatViewMedian - values[i].repeatViewMedian).toFixed(2);

      firstViewAverageResults.push(firstViewAverageDiff);
      secondViewAverageResults.push(repeatViewAverageDiff);
      firstViewMedianResults.push(firstViewMedianDiff);
      secondViewMedianResults.push(repeatViewMedianDiff);

      firstViewAverageResults.push(createCompareSymbol(firstViewAverageDiff));
      secondViewAverageResults.push(createCompareSymbol(repeatViewAverageDiff));
      firstViewMedianResults.push(createCompareSymbol(firstViewMedianDiff));
      secondViewMedianResults.push(createCompareSymbol(repeatViewMedianDiff));
    }
  }

  appendRow($('#avg_1st_body'), firstViewAverageResults);
  appendRow($('#avg_2nd_body'), secondViewAverageResults);
  appendRow($('#med_1st_body'), firstViewMedianResults);
  appendRow($('#med_2nd_body'), secondViewMedianResults);
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