(function() {
  'use strict';

  // Use momentjs to deal with displaying the time relative to now
  var fromNow = function () {
    return function (value) {
      var now         = moment();
      var date        = moment(value).utc();
      var difference  = now.diff(date);

      var diff = difference / 1000;

      var oneMin  = 60;
      var oneHour = oneMin * 60;
      var oneDay  = oneHour * 24;
      var oneYear = oneDay * 365;

      // Just now
      if (diff < oneMin) {
        return '1m';
      }
      // Under 1 hour ago
      else if (diff > oneMin && diff < oneHour) {
        return Math.round(diff/60) + 'm';
      }
      // Under 24 hours ago
      else if (diff >= oneHour && diff < oneDay) {
        return date.format('h:mm a');
      }
      // Yesterday (between 24h and 48h ago)
      else if (diff >= oneDay && diff < (oneDay * 2)) {
        return 'Yesterday';
      }
      // Under 1 year ago
      else if (diff >= (oneDay * 2) && diff < oneYear) {
        return date.format('MMM D');
      }
      // More than 1 year ago
      else if (diff >= oneYear) {
        return date.format('MMM D, YYYY');
      }

    };
  };

  angular
    .module('MainCtrl', [
      'postService'
    ])

  .controller('mainCtrl', function($window, Post) {

    var vm = this;
    vm.posts = null;

    var post = null;

    function init() {
      vm.posts = Post.query();
    };

    vm.goTo = function(url) {
      $window.open(url, '_blank');
    };

    vm.deletePost = function(post) {
      post = Post.get({ _id: post._id }, function() {
        post.$delete({ _id: post._id }, function(response) {
          console.log(response.message);
          init();
        });
      });
    };

    // Initialize the page
    // This is necessary because now when we delete a post we can force a refresh on the list of posts
    init();

  })

  // After creating a `fromNow` function, creating an Angular Filter for it is easy
  .filter('fromNow', fromNow);

})();