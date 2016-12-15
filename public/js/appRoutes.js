angular.module('appRoutes', []).config(
		[ '$routeProvider', '$locationProvider',
				function($routeProvider, $locationProvider) {

					$routeProvider
									
				
					.when('/db', {
						templateUrl : 'views/db.html',
						controller : 'DBController'
					})

					.when('/home', {
						templateUrl : 'views/home.html',
						controller : 'MainController'
					})

					.when('/', {
						templateUrl : 'views/home.html',
						controller : 'MainController'
					})

				

					.when('/dsi/viewer', {
						templateUrl : 'views/DSIViewer.html',
						controller : 'DSIController'
					})

															
					
					.when('/watsonServices', {
						templateUrl : 'views/watson/watsonServices.html',
						controller : 'WatsonController'
					})

					
					.when('/watson', {
						templateUrl : 'views/watson/watsonViewer.html',
						controller : 'WatsonController'
					})

					
					
					.otherwise({
						redirectTo : '/'
					});

					$locationProvider.html5Mode(true);

				} ]);