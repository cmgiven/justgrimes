import moment from 'moment-timezone';

Days = new Mongo.Collection('days');

if (Meteor.isClient) {
  import d3 from 'd3';
  import Konami from 'konami-js';

  Session.setDefault('rating', 0);

  // As ratings are streamed in, we initially prevent chart animation.
  var animateChart = false;
  setTimeout(function () { animateChart = true; }, 2000)

  Days.find().observe({
    added: chart,
    changed: chart
  });

  function chart() {
    var today = moment().tz('America/New_York').startOf('day');
    var fourWeeksAgo = today.clone().subtract(4, 'weeks');

    var data = Days.find(
      { date: { $gte: fourWeeksAgo.format('YYYY-MM-DD') } },
      { sort: { date: -1 } }
    ).fetch();

    var margin = 30;
    var xPadding = 80;
    var markerSize = 40;
    var width = 800 - (margin * 2);
    var height = 450 - (margin * 2);

    var x = d3.scaleTime()
      .domain([fourWeeksAgo, today])
      .range([0 + xPadding, width - xPadding]);

    var y = d3.scaleLinear()
      .domain([1, 5])
      .range([height, 0]);

    var xAxis = d3.axisBottom()
      .scale(x)
      .ticks(d3.timeDay.every(7))
      .tickFormat(d3.timeFormat('%b %d'));

    var yAxis = d3.axisLeft()
      .scale(y)
      .ticks(5)
      .tickSize(-width)
      .tickPadding(4);

    var enterSvg = d3.select('#chart')
      .selectAll('svg')
      .data([{}])
      .enter().append('svg')
      .attr('viewBox', '0 0 ' + (width + (margin * 2)) + ' ' + (height + (margin * 2)))
      .attr('width', '100%')
      .style('max-width', width + (margin * 2))
      .append('g')
      .attr('transform', 'translate(' + margin + ',' + margin + ')');

    enterSvg.append('g').attr('class', 'x axis')
      .attr('transform', 'translate(' + 0 + ',' + height + ')')
      .attr('role', 'presentation')
      .attr('aria-hidden', true);

    enterSvg.append('g').attr('class', 'y axis')
      .attr('role', 'presentation')
      .attr('aria-hidden', true);

    var svg = d3.select('#chart > svg > g');

    d3.select('#chart g.x.axis').call(xAxis);
    d3.select('#chart g.y.axis').call(yAxis);

    var line = d3.line()
      .x(function (d) { return x(moment(d.date)); })
      .y(function (d) { return y(d.points / d.ratingCount); })

    svg.selectAll('.graph')
      .data([[]])
      .enter().append('path')
      .attr('class', 'graph');

    svg.select('.graph')
      .datum(data)
      .transition()
      .duration(animateChart ? 250 : 0)
      .attr('d', line);

    var markers = svg.selectAll('.marker')
      .data(data, function (d) { return d.date; });

    var enterMarkers = markers.enter().append('g')
      .attr('class', 'marker')
      .attr('transform', function (d) {
        return 'translate(' + x(moment(d.date)) + ',' + y(d.points / d.ratingCount) + ')';
      })
      .attr('opacity', 1);

    enterMarkers.append('title');

    enterMarkers.append('image')
      .attr('width', markerSize)
      .attr('height', markerSize)
      .attr('x', -markerSize / 2)
      .attr('y', -markerSize / 2)
      .attr('xlink:href', '/images/justgrimes.svg');

    var enterBadges = enterMarkers.append('g')
      .attr('class', 'badge');

    enterBadges.append('title')
      .text('Number of ratings');

    enterBadges.append('path')
      .attr('d', badgePath(1, markerSize / 2 - 2))
      .attr('opacity', 0);

    enterBadges.append('text')
      .attr('x', (markerSize / 2) - 2)
      .attr('y', -(markerSize / 2) + 2)
      .attr('dy', '.52em')
      .attr('opacity', 0);

    var allMarkers = markers.merge(enterMarkers)
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });

    allMarkers
      .transition()
      .attr('transform', function (d) {
        return 'translate(' + x(moment(d.date)) + ',' + y(d.points / d.ratingCount) + ')';
      })
      .each(function (d) {
        var marker = d3.select(this);

        marker.select('title')
          .text(function (d) {
            return moment(d.date).format('MMMM D') + ': ' + (d.points / d.ratingCount).toFixed(2);
          });

        marker.select('.badge path')
          .transition()
          .attr('d', function () {
            var nchar = ('' + d.ratingCount).length
            return badgePath(nchar, markerSize / 2 - 2)
          })
          .attr('opacity', function () { return d.ratingCount > 1 ? 1 : 0; });

        marker.select('.badge text')
          .text(function () { return d.ratingCount; })
          .transition()
          .attr('opacity', function () { return d.ratingCount > 1 ? 1 : 0; });
      });

    markers.exit()
      .transition()
      .attr('opacity', 0)
      .remove();
  }

  function badgePath (nchar, offset) {
    var h = 14;
    var w = Math.max(nchar * 10, h);
    var r = h / 2;
    var x = offset - w / 2;
    var y = -offset - r + 2;

    var result = 'M' + (x + r) + ',' + y;
    result += 'h' + (w - r * 2);
    result += 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r;
    result += 'v' + (h - r * 2);
    result += 'a' + r + ',' + r + ' 0 0 1 ' + -r + ',' + r;
    result += 'h' + (r * 2 - w);
    result += 'a' + r + ',' + r + ' 0 0 1 ' + -r + ',' + -r;
    result += 'v' + (r * 2 - h);
    result += 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + -r;
    result += 'z';

    return result;
  }

  new Konami(function() {
    window.location.href = '/images/justgrimes_blackmirror.jpg';
  });

  Template.body.helpers({
    rating: function () { return Session.get('rating'); },
    checked: function (n) { return n === Session.get('rating') ? 'checked' : ''; },
    anyChecked: function () { return Session.get('rating') !== 0 ? 'class="active"' : ''; },
    days: function () { return Days.find({}, { sort: { date: -1 } }); },
    averageRating: function () { return (this.points / this.ratingCount).toFixed(2); }
  });

  Template.body.events({
    'submit #rating': function (e) {
      e.preventDefault();

      userHasRated = true;

      document.getElementById('submit').disabled = true;
      document.getElementById('rating').className += ' disabled';

      [].slice.call(e.target.getElementsByTagName('input'))
        .forEach(function (input, i) {
          input.disabled = true;
          if (input.checked) {
            var rating = parseInt(input.value, 10);
            Meteor.call('addRating', rating);

            [].slice.call(e.target.getElementsByTagName('label'))
              .forEach(function (label, j) {
                if (j <= i) {
                  setTimeout(function () {
                    label.className = 'spin';
                  }, j * 50);
                }
              });
          }
        });

      setTimeout(function () {
        [].slice.call(document.getElementsByTagName('input'))
          .forEach(function (input) {
            input.disabled = false;
            input.checked = false;
          });
        [].slice.call(e.target.getElementsByTagName('label'))
          .forEach(function (label) {
            label.className = ''
          });
        document.getElementById('rating').className = '';
        document.getElementById('submit').disabled = true;
      }, 4000);
    },
    'touchend #rating label': function (e) {
      var radio = document.getElementById(e.target.attributes.for.value);
      if (!radio.disabled) {
        radio.checked = true;
        document.getElementById('rating').className = 'active';
        document.getElementById('submit').disabled = false;
      }
    },
    'change #rating input[type="radio"]': function () {
      document.getElementById('rating').className = 'active';
      document.getElementById('submit').disabled = false;
    }
  });
}

if (Meteor.isServer) {
  var API = new Restivus();

  API.addRoute('rate/:rating', {
    post: function () {
      if (Meteor.call('addRating', parseRating(this.urlParams.rating))) {
        return { status: 'success' };
      } else {
        return { statusCode: 400, body: {
          status: 'error',
          message: 'Bad request: justgrimes must be rated with an whole number between 1 and 5'
        } };
      }
    }
  });

  API.addRoute('ratings', {
    get: function () {
      return Days.find({}, { fields: { '_id': 0 } }).fetch();
    }
  });

  API.addRoute('ratings/csv', {
    get: function () {
      var json = Days.find({}, { fields: { '_id': 0 } }).fetch();
      var keys = Object.keys(json[0]);
      var csv = keys.join(',') + '\n';

      json.forEach(function (row) {
        csv += keys.map(function (k) { return row[k]; }).join(',') + '\n';
      });

      return {
        headers: { 'Content-Type': 'text/plain' },
        body: csv
      };
    }
  });

  API.addRoute('ratings/xml', {
    get: function () {
      var json = Days.find({}, { fields: { '_id': 0 } }).fetch();
      var keys = Object.keys(json[0]);
      var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<ratings>\n';

      json.forEach(function (row) {
        xml += '\t<day>\n'

        keys.forEach(function (key) {
          xml += '\t\t<' + key + '>' + row[key] + '</' + key + '>\n'
        })

        xml += '\t</day>\n'
      });

      xml += '</ratings>'

      return {
        headers: { 'Content-Type': 'text/xml' },
        body: xml
      };
    }
  });

  API.addRoute('ratings/today', {
    get: function () {
      var today = moment().tz('America/New_York').format('YYYY-MM-DD');

      return responseForDate(today)
    }
  });

  API.addRoute('ratings/:date', {
    get: function () {
      var date = this.urlParams.date
      if (date.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)) {
        return responseForDate(date)
      } else {
        return { statusCode: 400, body: {
          status: 'error',
          message: 'Bad request: date must be in the format YYYY-MM-DD'
        } };
      }
    }
  });

  function parseRating(rating) {
    if (rating.match(/^[1-5]$/)) {
      return parseInt(rating, 10)
    }

    if (rating.match(/^one|two|three|four|five$/i)) {
      switch (rating.toLowerCase()) {
      case 'one':
        return 1;
      case 'two':
        return 2;
      case 'three':
        return 3;
      case 'four':
        return 4;
      case 'five':
        return 5;
      }
    }
  }

  function responseForDate(date) {
      var result = Days.findOne({ date: date }, { fields: { '_id': 0 } });

      if (result) {
        return result
      } else {
        return { statusCode: 205, body: {} }
      }
  }
}

Meteor.methods({
  addRating: function (rating) {
    if (rating >= 1 && rating <= 5) {
      var today = moment().tz('America/New_York').format('YYYY-MM-DD');
      Days.upsert(
        { date: today },
        {
          $inc: {
            points: rating,
            ratingCount: 1
          }
        }
      );
      return true
    }
  }
});
