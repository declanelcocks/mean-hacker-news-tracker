(function() {
  'use strict';

  angular
    .module('postService', [])

    .factory('Post', function($resource) {

      // We can all be thankful for angular-resource
      return $resource('/api/posts/:_id');

    });

})();