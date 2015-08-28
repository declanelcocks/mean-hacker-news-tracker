(function() {
  'use strict';

  angular
    .module('app.routes', [
      'ngRoute'
    ])

  .config(function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/main',
        controller: 'mainCtrl',
        controllerAs: 'main'
      })

      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
    
    });

})();