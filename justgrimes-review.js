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
              })
          }
        });
    },
    'change #rating input[type="radio"]': function () {
      document.getElementById('rating').className = 'active';
      document.getElementById('submit').disabled = false;
    }
  })
}

Meteor.methods({
  addRating: function (rating) {
    if (rating > 0 && rating <= 5) {
      var d = new Date();
      var today = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()].join('-');
      Days.upsert(
        { date: today },
        {
          $inc: {
            points: rating,
            ratingCount: 1
          }
        }
      );
    }
  }
});
