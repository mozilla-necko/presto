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

  $('#compare').change(compareLabel);
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
  for (let i = 0; i < names.length; ++i) {
    let th = $('<th/>');
    th.text(names[i]);
    tr.append(th);
  }

  thead.append(tr);
}

function appendRow(body, values) {
  let tr = $('<tr/>');

  for (let i = 0; i < values.length; ++i) {
    let td = $('<td/>');
    if (typeof(values[i]) == "object") {
      td.append(values[i].clone());
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
  let labels = [];

  if (!gEnv.label) {
    return;
  }
  labels.push(gEnv.label);

  if (gEnv.compare) {
    labels = labels.concat(gEnv.compare.filter((lb) => {
      return lb !== gEnv.label;
    }));
  }

  // console.log('refreshData() Labels: ' + labels);
  // console.log('refreshData() URL: ' + gEnv.url);

  clearTables();

  let urls = gEnv.url ? [gEnv.url] : listDomains();
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

  for (let i = 0; i < urls.length; ++i) {
    let url = urls[i];
    let promises = labels.map(label => {
      return fetchData(label, url);
    });

    let defaultRowValues = [i + 1, createLink(url)];
    let dataCount = (labels.length - 1) * 3 + 1;
    for (let j = 0; j < dataCount; ++j) {
      defaultRowValues.push('N/A');
    }
    appendRow($('#avg_1st_body'), defaultRowValues);
    appendRow($('#avg_2nd_body'), defaultRowValues);
    appendRow($('#med_1st_body'), defaultRowValues);
    appendRow($('#med_2nd_body'), defaultRowValues);

    Promise.all(promises).then(results => {
      displayData(i, url, results);
    }, reason => {
      console.log('error: ' + reason);
    });
  }
}

function createDisplayValue(url, value, count) {
  let link = createLink(url, value, count + ' valid samples');
  if (count != Meteor.settings.public.runs) {
    link.append($('<span class="glyphicon glyphicon-info-sign"/>'));
  }
  return link;
}

function displayData(index, url, results) {
  console.assert(results.length > 0);
  console.assert(results[0].data);
  console.assert(results[0].data.length > 0);

  let column = gEnv.field;
  // console.log('column = ' + column);
  // console.log(results);

  let values = results.map(result => {
    let { data, id } = result;
    // console.log(result);
    let resultURL = Meteor.settings.public.endpoint + '/results.php?test=' + id;

    let firstViewValues = data.filter((r) => {
      return r['Cached'] == '0';
    }).map(r => {
      return parseInt(r[column]);
    }).filter(n => {
      return !isNaN(n);
    });
    let repeatViewValues = data.filter((r) => {
      return r['Cached'] == '1';
    }).map(r => {
      return parseInt(r[column]);
    }).filter(n => {
      return !isNaN(n);
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

  let firstViewAverageResults = [];
  let secondViewAverageResults = [];
  let firstViewMedianResults = [];
  let secondViewMedianResults = [];

  for (let i = 0; i < values.length; ++i) {
    firstViewAverageResults.push(createDisplayValue(values[i].url, values[i].firstViewAverage, values[i].firstViewValues.length));
    secondViewAverageResults.push(createDisplayValue(values[i].url, values[i].repeatViewAverage, values[i].repeatViewValues.length));
    firstViewMedianResults.push(createDisplayValue(values[i].url, values[i].firstViewMedian, values[i].firstViewValues.length));
    secondViewMedianResults.push(createDisplayValue(values[i].url, values[i].repeatViewMedian, values[i].repeatViewValues.length));

    if (i > 0) {
      let firstViewAverageDiff = (values[0].firstViewAverage - values[i].firstViewAverage).toFixed(2);
      let repeatViewAverageDiff = (values[0].repeatViewAverage - values[i].repeatViewAverage).toFixed(2);
      let firstViewMedianDiff = (values[0].firstViewMedian - values[i].firstViewMedian).toFixed(2);
      let repeatViewMedianDiff = (values[0].repeatViewMedian - values[i].repeatViewMedian).toFixed(2);

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

  for (let i = 0; i < firstViewAverageResults.length; ++i) {
    let td = $('#avg_1st_body > tr:nth-child(' + (index + 1) + ') > td:nth-child(' + (i + 3) + ')');
    td.html(firstViewAverageResults[i]);
  }

  for (let i = 0; i < secondViewAverageResults.length; ++i) {
    let td = $('#avg_2nd_body > tr:nth-child(' + (index + 1) + ') > td:nth-child(' + (i + 3) + ')');
    td.html(secondViewAverageResults[i]);
  }

  for (let i = 0; i < firstViewMedianResults.length; ++i) {
    let td = $('#med_1st_body > tr:nth-child(' + (index + 1) + ') > td:nth-child(' + (i + 3) + ')');
    td.html(firstViewMedianResults[i]);
  }

  for (let i = 0; i < secondViewMedianResults.length; ++i) {
    let td = $('#med_2nd_body > tr:nth-child(' + (index + 1) + ') > td:nth-child(' + (i + 3) + ')');
    td.html(secondViewMedianResults[i]);
  }
}

displayDomain = function(url) {
  if (gEnv.url == url) { return; }

  // console.log('displayDomain: ' + url);
  gEnv.url = url;
  refreshData();
}

displayLabel = function(label) {
  if (gEnv.label == label) { return; }

  // console.log('displayLabel: ' + label);
  gEnv.label = label;
  refreshData();
}

displayField = function(field) {
  if (gEnv.field == field) { return; }

  // console.log('displayField: ' + field);
  gEnv.field = field;
  refreshData();
}

compareLabel = function() {
  let label = $('#compare').val();
  if (gEnv.compare == label) { return; }

  console.log('compareLabel: ' + label);
  gEnv.compare = label;
  refreshData();
}