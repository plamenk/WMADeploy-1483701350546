'use strict';

/**
 * @ngdoc function
 * @name factoryWorkFloorApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the factoryWorkFloorApp
 */
angular.module('factoryWorkFloorApp')
  .controller('MainCtrl', function($scope, $http) {

    $scope.send = function(name, station, kind) {

      console.log('Send Message');

      var messageObject = {
        message: {
          alert: "New issue: " + name
        },
        settings: {
          apns: {
            payload: {
              name: name,
              station: station,
              kind: kind,
              date: new Date().toLocaleString()
            },
            sound: 'default'
          }
        }
      }

      var config = {
                headers : {
                    'Content-Type': "application/json",
                    'appSecret': '4c15e114-979d-42f8-9ee2-daff8290ab30',

                }
        }


        $http.post('/push', JSON.stringify(messageObject), config)
              .success(function (data, status, headers, config) {
                  alert('Push successful send');
              })
              .error(function (data, status, header, config) {
                  console.log(data)
              });


    }


  });
