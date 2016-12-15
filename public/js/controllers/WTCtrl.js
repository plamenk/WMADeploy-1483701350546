var myApp = angular.module('WTCtrl', ['ngMaterial','ngResource', 'ui.bootstrap', 'angular-timeline','angular-scroll-animate','ngSanitize','ui.router', 'ngScrollbar','ja.qr']);

myApp.controller('WatsonController', ['$rootScope','$scope', '$http',  function(  $rootScope, $scope, $http) {
	
    $scope.Servicename = 'Watson Maintenance Advisor';
    $scope.Services = 'Available Services';
    
       
    
 $scope.availableServices = [
     {
            name : 'SDK for Node JS',
            icon : '../img/NodeJS.jpg'
    },
    {
            name : 'Claudant No0SQL DB',
            icon : '../img/Claudant.jpg'
    },
    {
            name : 'Dialog',
            icon : '../img/Dialog.jpg'
    },
    {
            name : 'Internet of Things Platform',
            icon : '../img/InternetOfThings.jpg'
    },
    {
            name : 'Retrieve and Rank',
            icon : '../img/RetrieveAndRank.jpg'
    },
    {
            name : 'Speech to Text',
            icon : '../img/SpeechToText.jpg'
    },
    {
            name : 'Text to Speech',
            icon : '../img/TextToSpeech.jpg'
    },
    {
            name : 'Visual Recognition',
            icon : '../img/VisualRecognition.png'
    },];
    

    $scope.rowCollection = [
        {serviceCounter: 0, serviceName: 'SDK for NODE JS Application', lastName: 'Renard'},
        {serviceCounter: 1, serviceName: 'Cloudant NoSQL', lastName: 'Renard'},
        {serviceCounter: 2, serviceName: 'Dialog', lastName: 'Faivre'},
        {serviceCounter: 3, serviceName: 'Internet of Things Platform (MQTT)'},
        {serviceCounter: 4, serviceName: 'Retrieve and Rank', lastName: 'Faivre'},
        {serviceCounter: 5, serviceName: 'Speech to Text', lastName: 'Faivre'},
        {serviceCounter: 6, serviceName: 'Text to Speech', lastName: 'Faivre'},
        {serviceCounter: 7, serviceName: 'Visual Recognition', lastName: 'Frere'}
    ];
    
    $scope.showQRCode = false;
    
    $scope.qrcodeString = '';
    $scope.size = 450;
    $scope.correctionLevel = '';
    $scope.typeNumber = 0;
    $scope.inputMode = '';
    $scope.image = true;
    
    $scope.keyValueList = [];
    $scope.getQRCodeEvent = function() {
              $http.get('/credent/QRCode').success(
                              function(data) {
                                       $scope.showQRCode = true;
                                       $scope.qrcodeString = JSON.stringify(data);
                                       $scope.keyValueList = [];
                                       for (var key in data){
                                           $scope.keyValueList.push({key: key,
                                               value: data[key]});
                                       }
                                       $scope.formInfo.credentials = JSON.stringify(data);
                                      
                              }).error(function(data) {
                                    $scope.qrcodeString = data;
                                    $scope.showQRCode = false;
                                    $scope.formInfo.credentials = data;
              });
    };  
    
    function getAllServices() {
              $http.get('/credent/allServices').success(
                              function(data) {
                                       //$scope.showQRCode = true;     
                                       $scope.formInfo.credentials = JSON.stringify(data.services.name)+ ' - - - - - - '+JSON.stringify(data.all) ;                                      
                              }).error(function(data) {
                                    //$scope.showQRCode = true;
                                    $scope.formInfo.credentials = data;
              });
    }; 
    
    getAllServices();


}]);
