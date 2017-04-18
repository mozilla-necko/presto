import { Template } from 'meteor/templating';
import { Tasks } from '../api/tasks.js'

import './navbar.html';

Template.navbar.helpers({
  domains() {
    let urls = [];

    for (let k of listDomains()) {
      urls.push({url: k});
    }

    // console.log('URLs: ' + JSON.stringify(urls));
    return urls;
  },

  numDomains() {
    return listDomains().length;
  },

  fields() {
    return [
      { value: "Speed Index", text: "Speed Index" },
      { value: "Load Time (ms)", text: "Load Time (ms)" },
      { value: "Time to First Byte (ms)", text: "Time to First Byte (ms)" },
      { value: "Bytes Out", text: "Bytes Out" },
      { value: "Bytes In", text: "Bytes In" },
      { value: "DNS Lookups", text: "DNS Lookups" },
      { value: "Connections", text: "Connections" },
      { value: "Requests", text: "Requests" },
      { value: "OK Responses", text: "OK Responses" },
      { value: "Redirects", text: "Redirects" },
      { value: "Not Modified", text: "Not Modified" },
      { value: "Not Found", text: "Not Found" },
      { value: "Other Responses", text: "Other Responses" },
      { value: "Time to Start Render (ms)", text: "Time to Start Render (ms)" },
      { value: "Segments Transmitted", text: "Segments Transmitted" },
      { value: "Segments Retransmitted", text: "Segments Retransmitted" },
      { value: "Packet Loss (out)", text: "Packet Loss (out)" },
      { value: "Activity Time(ms)", text: "Activity Time(ms)" },
      { value: "Doc Complete Time (ms)", text: "Doc Complete Time (ms)" },
      { value: "Event GUID", text: "Event GUID" },
      { value: "Time to DOM Element (ms)", text: "Time to DOM Element (ms)" },
      { value: "Includes Object Data", text: "Includes Object Data" },
      { value: "Cache Score", text: "Cache Score" },
      { value: "Static CDN Score", text: "Static CDN Score" },
      { value: "One CDN Score", text: "One CDN Score" },
      { value: "GZIP Score", text: "GZIP Score" },
      { value: "Cookie Score", text: "Cookie Score" },
      { value: "Keep-Alive Score", text: "Keep-Alive Score" },
      { value: "DOCTYPE Score", text: "DOCTYPE Score" },
      { value: "Minify Score", text: "Minify Score" },
      { value: "Combine Score", text: "Combine Score" },
      { value: "Bytes Out (Doc)", text: "Bytes Out (Doc)" },
      { value: "Bytes In (Doc)", text: "Bytes In (Doc)" },
      { value: "DNS Lookups (Doc)", text: "DNS Lookups (Doc)" },
      { value: "Connections (Doc)", text: "Connections (Doc)" },
      { value: "Requests (Doc)", text: "Requests (Doc)" },
      { value: "OK Responses (Doc)", text: "OK Responses (Doc)" },
      { value: "Redirects (Doc)", text: "Redirects (Doc)" },
      { value: "Not Modified (Doc)", text: "Not Modified (Doc)" },
      { value: "Not Found (Doc)", text: "Not Found (Doc)" },
      { value: "Other Responses (Doc)", text: "Other Responses (Doc)" },
      { value: "Compression Score", text: "Compression Score" },
      { value: "ETag Score", text: "ETag Score" },
      { value: "Flagged Requests", text: "Flagged Requests" },
      { value: "Flagged Connections", text: "Flagged Connections" },
      { value: "Max Simultaneous Flagged Connections", text: "Max Simultaneous Flagged Connections" },
      { value: "Time to Base Page Complete (ms)", text: "Time to Base Page Complete (ms)" },
      { value: "Base Page Result", text: "Base Page Result" },
      { value: "Gzip Total Bytes", text: "Gzip Total Bytes" },
      { value: "Gzip Savings", text: "Gzip Savings" },
      { value: "Minify Total Bytes", text: "Minify Total Bytes" },
      { value: "Minify Savings", text: "Minify Savings" },
      { value: "Image Total Bytes", text: "Image Total Bytes" },
      { value: "Image Savings", text: "Image Savings" },
      { value: "Base Page Redirects", text: "Base Page Redirects" },
      { value: "AFT (ms)", text: "AFT (ms)" },
      { value: "DOM Elements", text: "DOM Elements" },
      { value: "PageSpeed Version", text: "PageSpeed Version" },
      { value: "Time to Title", text: "Time to Title" },
      { value: "Load Event Start", text: "Load Event Start" },
      { value: "Load Event End", text: "Load Event End" },
      { value: "DOM Content Ready Start", text: "DOM Content Ready Start" },
      { value: "DOM Content Ready End", text: "DOM Content Ready End" },
      { value: "Visually Complete (ms)", text: "Visually Complete (ms)" },
      { value: "Base Page Server Count", text: "Base Page Server Count" },
      { value: "Base Page Server RTT", text: "Base Page Server RTT" }
    ];
  }
});

Template.navbar.onRendered(function() {
  // console.log('navbar.onRendered');
  $('.scrollable-menu li a').click(function(e) {
    let parent = $(this).parent();
    parent.parent().children().removeClass('active');

    if (!parent.hasClass('active')) {
      parent.addClass('active');
    }
    e.preventDefault();
  });

  $('#domains li a:first').click();
  $('#fields li a:first').click();

  $('#addBuildModal').on('shown.bs.modal', function () {
    $('#build_email').focus()
  })
});

Template.domainItem.onRendered(function() {
  // console.log('domainItem.onRendered');

    $('#domains li a').unbind('click');
    $('#domains li a').click(function(e) {
    let parent = $(this).parent();
    parent.parent().children().removeClass('active');

    if (!parent.hasClass('active')) {
      parent.addClass('active');
    }
    e.preventDefault();
  });
});