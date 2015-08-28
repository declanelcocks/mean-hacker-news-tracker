(function() {
  'use strict';

  angular
    .module('hackerNews', [
      'app.routes',
      'ngResource',
      'NavCtrl',
      'MainCtrl'
    ])

    .run(['$rootScope', '$anchorScroll', function($rootScope, $anchorScroll) {
      $rootScope.$on('$viewContentLoaded', function(){ 
        $anchorScroll();
      });
    }]);
  
})();