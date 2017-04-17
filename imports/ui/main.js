import { Tasks } from '../api/tasks.js';
import { Template } from 'meteor/templating';

import './main.html';

let gEnv = {
  cache: {}
};

Template.main.helpers({
  labels() {
    return listBuildLabels();
  },

  panes() {
    return [
      { pane: "med_1st", text: "Median" },
      { pane: "med_2nd", text: "Median (Cached)" },
      { pane: "avg_1st", text: "Average" },
      { pane: "avg_2nd", text: "Average (Cached)" },
    ];
  }
});

Template.main.onRendered(function() {
  $('#nav_tabs li a:first').click();

  let url = $('#domains li a:first').text();
  let field = $('#fields li a:first').text();

  $('#currentDomain').text(url);
  $('#currentField').text(field);

  $('#compare').change(compareLabel);
});


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

let gStatistics;

function clearTables() {
  gStatistics = {
    "names": {},
    "avg_1st": {},
    "avg_2nd": {},
    "med_1st": {},
    "med_2nd": {}
  };

  for (let name of ['avg_1st','avg_2nd','med_1st','med_2nd']) {
    setHeader($('#' + name + '_head'), []);
    $('#' + name + '_body').empty();
    $('#' + name + '_plot').addClass('hidden');
  }
}

//********************
//* UI Operations *
//********************
function getNameByLabel(label) {
  let labels = listBuildLabels();
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

function createCompareValue(percentage) {
  if (isNaN(percentage)) {
    return 'N/A';
  }
  return Math.abs(percentage) + '%';
}

function createCompareSymbol(value) {
  let arrow = $('<span/>');

  if (value > 0) {
    arrow.addClass('glyphicon glyphicon-triangle-top');
    arrow.css('color', 'red');
  } else if (value < 0) {
    arrow.addClass('glyphicon glyphicon-triangle-bottom');
    arrow.css('color', 'green');
  } else if (value == 0) {
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
      gStatistics.names[i] = labelNames[i];
      for (let name of ['avg_1st','avg_2nd','med_1st','med_2nd']) {
        gStatistics[name][i] = [];
      }

      firstViewAverageHeader.push('Diff');
      secondViewAverageHeader.push('Diff');
      firstViewMedianHeader.push('Diff');
      secondViewMedianHeader.push('Diff');
    }
  }

  setHeader($('#avg_1st_head'), firstViewAverageHeader);
  setHeader($('#avg_2nd_head'), secondViewAverageHeader);
  setHeader($('#med_1st_head'), firstViewMedianHeader);
  setHeader($('#med_2nd_head'), secondViewMedianHeader);

  let counter = 0;
  function check() {
    if (++counter == urls.length) { onDataDisplayed(labelNames.length); }
  }

  for (let i = 0; i < urls.length; ++i) {
    let url = urls[i];
    let promises = labels.map(label => {
      return fetchData(label, url);
    });

    let defaultRowValues = [i + 1, createLink(url)];
    let dataCount = (labels.length - 1) * 2 + 1;
    for (let j = 0; j < dataCount; ++j) {
      defaultRowValues.push('N/A');
    }
    for (let id of ['avg_1st_body','avg_2nd_body','med_1st_body','med_2nd_body']) {
      appendRow($('#' + id), defaultRowValues);
    }

    Promise.all(promises).then(results => {
      displayData(i, url, results);
      check();
    }, reason => {
      console.log('warning: ' + reason);
      check();
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
  console.assert(results.length > 0, '%d: %s', index+1, url);
  console.assert(results[0].data, '%d: %s', index+1, url);
  console.assert(results[0].data.length > 0, '%d: %s', index+1, url);

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
      firstViewMedian: med(firstViewValues).toFixed(1),
      repeatViewValues: repeatViewValues,
      repeatViewAverage: avg(repeatViewValues).toFixed(2),
      repeatViewMedian: med(repeatViewValues).toFixed(1)
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
      let firstViewAverageDiff = (values[0].firstViewAverage - values[i].firstViewAverage);
      let repeatViewAverageDiff = (values[0].repeatViewAverage - values[i].repeatViewAverage);
      let firstViewMedianDiff = (values[0].firstViewMedian - values[i].firstViewMedian);
      let repeatViewMedianDiff = (values[0].repeatViewMedian - values[i].repeatViewMedian);

      let percentages = {
        "avg_1st" : Math.round(firstViewAverageDiff * 100 / values[0].firstViewAverage),
        "avg_2nd" : Math.round(repeatViewAverageDiff * 100 / values[0].repeatViewAverage),
        "med_1st" : Math.round(firstViewMedianDiff * 100 / values[0].firstViewMedian),
        "med_2nd" : Math.round(repeatViewMedianDiff * 100 / values[0].repeatViewMedian)
      };

      for (let name of ['avg_1st','avg_2nd','med_1st','med_2nd']) {
        gStatistics[name][i].push(percentages[name]);
      }

      firstViewAverageResults.push(createCompareSymbol(firstViewAverageDiff)
        .append(createCompareValue(percentages.avg_1st)));
      secondViewAverageResults.push(createCompareSymbol(repeatViewAverageDiff)
        .append(createCompareValue(percentages.avg_2nd)));
      firstViewMedianResults.push(createCompareSymbol(firstViewMedianDiff)
        .append(createCompareValue(percentages.med_1st)));
      secondViewMedianResults.push(createCompareSymbol(repeatViewMedianDiff)
        .append(createCompareValue(percentages.med_2nd)));
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

function makeChartData(data) {
  return {
    x: [1, 2, 3, 4, 5],
    y: [1, 2, 4, 8, 16]
  };
}

function onDataDisplayed(numColumns) {
  console.log('onDataDisplayed: %d', numColumns);

  let traces = {};
  for (let id of ['avg_1st_plot','avg_2nd_plot','med_1st_plot','med_2nd_plot']) {
    traces[id] = [];
  }
  for (let i = 1; i < numColumns; ++i) {
    for (let name of ['avg_1st','avg_2nd','med_1st','med_2nd']) {
      traces[name + '_plot'].push({ x: gStatistics[name][i], type: 'histogram', name: gStatistics.names[i] });
    }
  }

  const layout = {
    title: 'Histogram of Difference (%)'
  };
  if (numColumns > 1) {
    for (let id of ['avg_1st_plot','avg_2nd_plot','med_1st_plot','med_2nd_plot']) {
      $('#' + id).removeClass('hidden');
      Plotly.newPlot(id, traces[id], layout);
    }
  }

  console.log(gStatistics);
}

displayDomain = function(url) {
  if (gEnv.url == url) { return; }

  // console.log('displayDomain: ' + url);
  gEnv.url = url;

  $('#currentDomain').text(url);

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

  $('#currentField').text(field);

  refreshData();
}

compareLabel = function() {
  let label = $('#compare').val();
  if (gEnv.compare == label) { return; }

  // console.log('compareLabel: ' + label);
  gEnv.compare = label;
  refreshData();
}
