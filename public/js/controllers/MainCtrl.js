var myApp = angular.module('MainCtrl', ['ngMaterial','ngResource','treeGrid']);


myApp.constant('ENDPOINT_URI', 'http://localhost:9080/res/');
myApp.service('ItemsModel', function ($http, ENDPOINT_URI) {
    var service = this;
    var path = 'api/v1/rulesets';

    function getUrl() {
      return ENDPOINT_URI + path;
    }

    function getUrlForId(itemId) {
      return getUrl(path) + itemId;
    }

    service.all = function () {
      return $http.get(getUrl());
    };


  });


myApp.controller('MainController', ['$rootScope','$scope', '$http', '$resource', '$mdBottomSheet', function(  $rootScope, $scope, $http, $resource, $mdBottomSheet, ItemsModel) {
	
// Beginn tree
	  var tree;
	 $scope.ruleapps = {};
	 $scope.rulesetSelected = {};

	 
      var rawTreeData = [
          {
              "DemographicId": 1,
              "ParentId": null,
              "Name": "United States of America",
              "Description": "United States of America",
              "Area": 9826675,
              "Population": 918212000,
              "TimeZone": "UTC -5 to -10"
          },
          {
              "DemographicId": 2,
              "ParentId": 1,
              "Name": "California",
              "Description": "The Tech State",
              "Area": 423970,
              "Population": 38340000,
              "TimeZone": "Pacific Time"
          },
          {
              "DemographicId": 3,
              "ParentId": 2,
              "Name": "San Francisco",
              "Description": "The happening city",
              "Area": 231,
              "Population": 837442,
              "TimeZone": "PST"
          },
          {
              "DemographicId": 4,
              "ParentId": 1,
              "Name": "Los Angeles",
              "Description": "Disco city",
              "Area": 503,
              "Population": 3904657,
              "TimeZone": "PST"
          },
          ];

	 var myTreeData = getTree(rawTreeData, 'DemographicId', 'ParentId');

     $scope.tree_data = myTreeData;
     $scope.my_tree = tree = {};
     $scope.expanding_property = {
         field: "Name",
         displayName: "Demographic Name",
			sortable : true,
			filterable: true
     };
     $scope.col_defs = [
         {
             field: "Description",
				sortable : true,										
				sortingType : "string"
         },
         {
             field: "Area",
				sortable : true,										
				sortingType : "number",
				filterable: true
         },
         {
             field: "Population",
				sortable : true,										
				sortingType : "number"
         },
         {
             field: "TimeZone",
             displayName: "Time Zone"
         }
     ];
     $scope.my_tree_handler = function (branch) {
         console.log('you clicked on', branch)
     }
	 
	 
	 function getTree(data, primaryIdName, parentIdName) {
         if (!data || data.length == 0 || !primaryIdName || !parentIdName)
             return [];

         var tree = [],
             rootIds = [],
             item = data[0],
             primaryKey = item[primaryIdName],
             treeObjs = {},
             parentId,
             parent,
             len = data.length,
             i = 0;

         while (i < len) {
             item = data[i++];
             primaryKey = item[primaryIdName];
             treeObjs[primaryKey] = item;
             parentId = item[parentIdName];

             if (parentId) {
                 parent = treeObjs[parentId];

                 if (parent.children) {
                     parent.children.push(item);
                 } else {
                     parent.children = [item];
                 }
             } else {
                 rootIds.push(primaryKey);
             }
         }

         for (var i = 0; i < rootIds.length; i++) {
             tree.push(treeObjs[rootIds[i]]);
         };

         return tree;
     }
	 
	 // end Tree
	 
	 function getItems() {
	    ItemsModel.all().success(function (result) {
	           $scope.mainHeader = main.items;
	        }).error(function(error){
	        	$scope.mainHeader = "FEHLER: "+result;
	        });
	 }
	//getItems();   
	     
     
//	 $scope.user = {
//		      name: 'Kai Herrmann',
//		      email: 'kai.herrmann@de.ibm.com',
//		      phone: '+49(0)-15204060-093',
//		      address: 'Bensheim 64625',
//		      donation: 19.99
//		    };
	
//	 $scope.items = [
//	                 { name: 'Rule Execution', icon: '../libs/material-design-icons/hangout.svg' },
//	                 { name: 'Copy', icon: '../libs/material-design-icons/content/svg/design/ic_content_copy_48px.svg' },
//	               ];
//      


	
	 
	 
	 $scope.rowCollection = [
	                        {type: 'Get', name: 'getRuleApps:/ruleapps', meaning: 'Returns all the RuleApps contained in the repository.', url: 'localhost:9080/res/api/v1/rulesets'},
	                        {type: 'Get', name: 'getCountOfRuleApps: /ruleapps?count=true', meaning: 'Counts the number of elements in this list.', url: 'http://localhost/res/api/v1/rulesets'},
	                        {type: 'Get', name: 'getRuleApps', meaning: 'Returns all the RuleApps contained in the repository.', url: '/res/api/v1/ruleapps'}
	                    ];
	               
	var antrag = "<par:Request xmlns:par=\"http://www.ibm.com/rules/decisionservice/AURuleApp/AURuleset/param\" "
		+ "xmlns:ngt=\"http://NGT01\">‌<par:DecisionID>string</par:DecisionID>‌<ngt:Antrag>‌"
		+ "<ngt:antragsNummer>string</ngt:antragsNummer>‌<ngt:antragsDatum>2008-09-28T21:49:45</ngt:antragsDatum>‌"
		+ "<ngt:bescheinigung_bis>2014-09-18T19:18:33</ngt:bescheinigung_bis>‌"
		+ "<ngt:bescheinigung_von>2006-08-19T13:27:14-04:00</ngt:bescheinigung_von>‌"
		+ "<ngt:arbeitsunfaehigkeit>false</ngt:arbeitsunfaehigkeit>‌"
		+ "<ngt:folgebescheinigung>true</ngt:folgebescheinigung>‌"
		+ "<ngt:erstbescheinigung>true</ngt:erstbescheinigung>‌"
		+ "<ngt:diagnose>string</ngt:diagnose>‌"
		+ "</ngt:Antrag>‌</par:Request>‌";
	
	

	
	
	
	$scope.ruleappSelected = function(ruleapp,all){
		$scope.mainHeader = all; 
		$scope.rulesetSelected = all.version;
	}
	
	 $scope.listItemClick = function (httpSelect) {
         // use $.param jQuery function to serialize data from JSON	
          $scope.mainHeader = httpSelect;
    
          $http.get('/odm/allAppsSets').success(function (data, status, headers, config) {
      		console.log("################-------------------"+data);
      	      try {
      	    	var x2js = new X2JS();
      	    	var xml_str2json = angular.bind(x2js, x2js.xml_str2json, data)();
      	    	$scope.mainHeader = "Decision Server -- Ruleapps/Rulesets";
      	    	$scope.ruleapps = xml_str2json;
      	      } catch(EE) {
      	        alert(EE);
      	        $scope.result1 = EE + "";
      	      }

      		//$scope.mainHeader = "Erfolg: " + data;
       
          })
          .error(function (data, status, header, config) {
          	console.log("################--------FEHLNER-----------"+data);
          	$scope.mainHeader = "Fehler: " + data + "  " + status + "  " + header + " " + config; 
          	
          	$scope.ResponseDetails = "Data: " + data + "    "+header;
                  "<br />status: " + status +
      	            "<br />headers: " + jsonFilter(header) +
      	            "<br />config: " + jsonFilter(config);
          });          
      };


	
	$scope.mainHeader = 'Auffälligkeiten identifizieren';
	$scope.$on("MyEvent", function(evt,data){ 
		$scope.mainHeader  = data;
		console.log(evt);
	});

	
	$scope.vm				= {};
	$scope.formInfo 		= {};
	$scope.formInfo.ruleApp = "";
	$scope.formInfo.REST 	= false;
	$scope.formInfo.WS 		= false;
	$scope.formInfo.JSON	= false;

	$scope.$watch('formInfo.executionType', function(value) {
	       console.log(value);
	       
	       if(value == 'XML_REST'){
	    	   $scope.formInfo.ruleApp = "XML REST selected";	    		   
	    	   $scope.theHeader = 'Calling the Operational Decision Mamagement via XML REST';
	    	   $scope.formInfo.REST = true;
    		   $scope.formInfo.WS 		= false;
	    	   $scope.formInfo.JSON	= false;

	       }	
	       else if (value == 'XML_WS'){
	    	   $scope.formInfo.ruleApp = "XML WEB SERVICE selected";	    		   
	    	   $scope.theHeader = 'Calling the Operational Decision Mamagement via XML WEB SERVICE';
	    	   $scope.formInfo.WS = true;
	    	   $scope.formInfo.REST 	= false;
	    	   $scope.formInfo.JSON	= false;
	    	   
	       }
	       else if(value == 'JSON'){
	    	   $scope.formInfo.ruleApp = "JSON selected";	    		   
	    	   $scope.theHeader = 'Calling the Operational Decision Mamagement via JSON';
	    	   $scope.formInfo.JSON = true;
	    	   $scope.formInfo.REST 	= false;
	    	   $scope.formInfo.WS 		= false;	    	   
	       }
	 });
	
	
	
	
	
	
	$scope.refresh = function() {
		$http.get("api/rest").sucess(function(data){
			$scope.theHeader = data;
		});
	};
	
	
	$scope.sub = function() {
	    $http.get('/view1', $scope.formDat).
	    success(function(data) {
	    	$scope.theHeader = $scope.formDat.ruleapp + "\"" + $scope.formDat.ruleset+"\RICHTIG";
	    }).error(function(data) {
	    	$scope.theHeader = $scope.formDat.ruleapp + "\"" + $scope.formDat.ruleset+"\FEHLER";
	    })
	};
	
	
	 $scope.item = {
			    star: false,
			    favorite: false,
			    bookmark: false
			  };
	 
	    $scope.loading = false ; 
	    
	    $scope.onSubmit = function(){
	        $scope.loading = true ; 
	    }
	    $scope.cancel = function(){
	        $scope.loading = false ; 
	    }

	    

}])


.directive('buttonStar', function() {
	  return {
	    scope: true,
	    restrict: 'E',
	    template: '<button class="btn btn-icon"><span class="glyphicon glyphicon-star" ng-class="{active: item.star}"></span></button>',
	    link: function(scope, elem) {
	      elem.bind('click', function() {
	        scope.$apply(function(){
	          scope.item.star = !scope.item.star;
	        });
	      });
	    }
	  };
	})

	.directive('buttonFavorite', function() {
	  return {
	    scope: true,
	    restrict: 'E',
	    template: '<button class="btn btn-icon"><span class="glyphicon glyphicon-heart" ng-class="{active: item.favorite}"></span></button>',
	    link: function(scope, elem) {
	      elem.bind('click', function() {
	        scope.$apply(function(){
	          scope.item.favorite = !scope.item.favorite;
	        });
	      });
	    }
	  };
	})

	.directive('buttonBookmark', function() {
	  return {
	    scope: true,
	    restrict: 'E',
	    template: '<button class="btn btn-icon"><span class="glyphicon glyphicon-bookmark" ng-class="{active: item.bookmark}"></span></button>',
	    link: function(scope, elem) {
	      elem.bind('click', function() {
	        scope.$apply(function(){
	          scope.item.bookmark = !scope.item.bookmark;
	        });
	      });
	    }
	  };
	});

	
	
	
	
	
	
	
// .run(function($http, $templateCache) {
// var urls = [
// '../libs/material-design-icons/file/svg/design/share-arrow.svg',
// '../libs/material-design-icons/file/svg/design/ic_cloud_upload_48px.svg',
// '../libs/material-design-icons/file/svg/design/copy.svg',
// '../libs/material-design-icons/file/svg/design/print.svg',
// '../libs/material-design-icons/hangout.svg',
// '../libs/material-design-icons/file/svg/design/mail.svg',
// '../libs/material-design-icons/file/svg/design/message.svg',
// '../libs/material-design-icons/file/svg/design/copy2.svg',
// '../libs/material-design-icons/file/svg/design/facebook.svg',
// '../libs/material-design-icons/file/svg/design/twitter.svg'
// ];
// angular.forEach(urls, function(url) {
// $http.get(url, {cache: $templateCache});
// });
// });
//
