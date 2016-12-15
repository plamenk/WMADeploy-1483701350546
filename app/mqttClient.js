// app/routes.js

var express    	 = require('express');
var app          = express();
var router 		 = express.Router();
var dbCloudant = require('./cloudantdb');
var Client = require("ibmiotf");
   
var appClientConfig = {
"org" : "8ksc8u",
"id" : "kai007dLocal01234567890123212234",
"auth-key" : "a-8ksc8u-brosik06lf",
"auth-token" : "PMoYfb4-L7wKhP!lPc"
};

var appClient = new Client.IotfApplication(appClientConfig);
appClient.connect();

appClient.on("connect", function () {
    console.log("MQTT App connected");
    appClient.subscribeToDeviceEvents("workposition","5650F251","+","json");
console.log("MQTT App subcribed");
});

appClient.on("deviceEvent", function (deviceType, deviceId, eventType, format, payload) {
    console.log("Device Event from :: "+deviceType+" : "+deviceId+" of event "+eventType+" with payload : "+payload + " in format " + format);
    var temp = JSON.parse(payload);
    console.log(JSON.parse(payload));
    
    var problemartWerte = [
        'electrical',
        'hydraulical'
    ];
    
    var electrHydrau = 'electrical';
    if(temp.problem_art !== ''){
        var electrHydrau = temp.problem_art;
    }
    
    
    //var randomValue = Math.floor(Math.random()*problemartWerte.length);
    
    var myData = {
        //topic: String(topic), 
        //payload:String(message),
        processed: false,
        id: '',//temp.id,
        problemart: electrHydrau,
        arbeitsstation: temp.work_position,
        status: 'open',
        inventurnummer: '',
        anlagename: temp.status_description,
        kostenstelle: '566',
        stoerungsbeschreibung: '' ,
        date: new Date()
    }
    
    //io.sockets.emit('mqtt', myData);
       
      dbCloudant.createIssueDocument(myData,function(results){
          console.log("~~~~~~~~~~~~~~~~~~~~~~~~~  "+results);
      });
    
    
    //io.emit('message', JSON.parse(payload));
});

function insert(){
 var myData = {
        //topic: String(topic), 
        //payload:String(message),
        processed: false,
        id: '',//temp.id,
        problemart: 'electrical',
        arbeitsstation: '4',
        status: 'open',
        inventurnummer: '',
        anlagename: 'Weber Station M6',
        kostenstelle: '5650',
        stoerungsbeschreibung: '' ,
        date: new Date()
    }
    
    //io.sockets.emit('mqtt', myData);
       
      dbCloudant.createIssueDocument(myData,function(results){
          console.log("~~~~~~~~~~~~~~~~~~~~~~~~~  "+results);
      });
      
      }
//insert();
module.exports = router;

/*
 *
 */