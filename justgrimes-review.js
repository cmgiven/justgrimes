Days = new Mongo.Collection('days');

if (Meteor.isClient) {
  Session.setDefault('rating', 0);

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
