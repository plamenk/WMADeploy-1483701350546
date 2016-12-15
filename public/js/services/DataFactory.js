var theApp = angular.module('customersApp');
theApp.service('dataService', ['$http', function ($http) {

        var urlBase = 'http://localhost:9080/res/api/v1/rulesets';

        this.getCustomers = function () {
            return $http.get(urlBase);
        };

        this.getCustomer = function (id) {
            return $http.get(urlBase + '/' + id);
        };

        this.insertCustomer = function (cust) {
            return $http.post(urlBase, cust);
        };

        this.updateCustomer = function (cust) {
            return $http.put(urlBase + '/' + cust.ID, cust)
        };

        this.deleteCustomer = function (id) {
            return $http.delete(urlBase + '/' + id);
        };

        this.getOrders = function (id) {
            return $http.get(urlBase + '/' + id + '/orders');
        };
    }]);


theApp.controller('customersController', ['$scope', 'dataFactory', 
    function ($scope, dataFactory) {

$scope.status;
$scope.customers;
$scope.orders;
$scope.headline;

getCustomers();

function getCustomers() {
    dataFactory.getCustomers()
        .success(function (custs) {
            $scope.customers = custs;
            $scope.headline = custs;
        })
        .error(function (error) {
        	$scope.headline = "Fehler: "+error;
            $scope.status = 'Unable to load customer data: ' + error.message;
        });
}

$scope.updateCustomer = function (id) {
    var cust;
    for (var i = 0; i < $scope.customers.length; i++) {
        var currCust = $scope.customers[i];
        if (currCust.ID === id) {
            cust = currCust;
            break;
        }
    }

    dataFactory.updateCustomer(cust)
      .success(function () {
          $scope.status = 'Updated Customer! Refreshing customer list.';
      })
      .error(function (error) {
          $scope.status = 'Unable to update customer: ' + error.message;
      });
};

$scope.insertCustomer = function () {
    //Fake customer data
    var cust = {
        ID: 10,
        FirstName: 'JoJo',
        LastName: 'Pikidily'
    };
    dataFactory.insertCustomer(cust)
        .success(function () {
            $scope.status = 'Inserted Customer! Refreshing customer list.';
            $scope.customers.push(cust);
        }).
        error(function(error) {
            $scope.status = 'Unable to insert customer: ' + error.message;
        });
};

$scope.deleteCustomer = function (id) {
    dataFactory.deleteCustomer(id)
    .success(function () {
        $scope.status = 'Deleted Customer! Refreshing customer list.';
        for (var i = 0; i < $scope.customers.length; i++) {
            var cust = $scope.customers[i];
            if (cust.ID === id) {
                $scope.customers.splice(i, 1);
                break;
            }
        }
        $scope.orders = null;
    })
    .error(function (error) {
        $scope.status = 'Unable to delete customer: ' + error.message;
    });
};

$scope.getCustomerOrders = function (id) {
    dataFactory.getOrders(id)
    .success(function (orders) {
        $scope.status = 'Retrieved orders!';
        $scope.orders = orders;
    })
    .error(function (error) {
        $scope.status = 'Error retrieving customers! ' + error.message;
    });
};
}]);