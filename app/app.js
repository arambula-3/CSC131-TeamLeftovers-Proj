(function () {
    'use strict';

    angular
        .module('app', ['ui.router'])
        .config(config)
        .run(run);

    function config($stateProvider, $urlRouterProvider) {
        // default route
        $urlRouterProvider.otherwise("/");

        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'home/index.html',
                controller: 'Home.IndexController',
                controllerAs: 'vm',
                data: { activeTab: 'home' }
            })
            .state('account', {
                url: '/account',
                templateUrl: 'account/index.html',
                controller: 'Account.IndexController',
                controllerAs: 'vm',
                data: { activeTab: 'account' }
            })//;
            // image DB
            .state('imageDB', {
                url: '/imageDB',
                templateUrl: 'imageDB/index.html',
                controller: 'imageDB.IndexController',
                controllerAs: 'vm',
                data: { activeTab: 'imageDB' }
            })
            // view sets
            .state('viewSets', {
                url: '/viewSets',
                templateUrl: 'sets/viewSets/index.html',
                controller: 'sets/viewSets/viewSets.IndexController',
                controllerAs: 'vm',
                data: { activeTab: 'View Sets' }
            })
            // create sets
            .state('createSets', {
                url: '/createSets',
                templateUrl: 'sets/createSets/index.html',
                controller: 'sets/createSets/createSets.IndexController',
                controllerAs: 'vm',
                data: { activeTab: 'Create Sets' }
            })
            // edit sets
            .state('editSets', {
                url: '/editSets',
                templateUrl: 'sets/editSets/index.html',
                controller: 'sets/editSets/editSets.IndexController',
                controllerAs: 'vm',
                data: { activeTab: 'Edit Sets' }
            })
            // delete sets
            .state('deleteSets', {
                url: '/deleteSets',
                templateUrl: 'sets/deleteSets/index.html',
                controller: 'sets/deleteSets/deleteSets.IndexController',
                controllerAs: 'vm',
                data: { activeTab: 'Delete Sets' }
            });
    }

    function run($http, $rootScope, $window) {
        // add JWT token as default auth header
        $http.defaults.headers.common['Authorization'] = 'Bearer ' + $window.jwtToken;

        // update active tab on state change
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            $rootScope.activeTab = toState.data.activeTab;
        });
    }

    // manually bootstrap angular after the JWT token is retrieved from the server
    $(function () {
        // get JWT token from server
        $.get('/app/token', function (token) {
            window.jwtToken = token;

            angular.bootstrap(document, ['app']);
        });
    });
})();
