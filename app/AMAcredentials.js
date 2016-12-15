var express         = require('express');
var app             = express();
var bluemix         = require('../config/bluemix');
var vcapServices    = require('vcap_services');
var extend          = require('util')._extend;  
var watson          = require('watson-developer-cloud');
var router          = express.Router();
var cfenv           = require('cfenv');

console.log('>> Credentials ....................... will be loaded');
console.log('>>     1. Dialog');
var dialogCredentials = extend({
	url : 'https://gateway.watsonplatform.net/dialog/api',
	username : '5371c7e0-f88a-4fa6-855a-f384d8bc02fe',
	password : 's54Y4aJolTDg',
	version : 'v1'
}, bluemix.getServiceCreds('dialog')); // VCAP_SERVICES


console.log('>>     2. Visual Recognition');
var visualRecogCredentials = extend({
	url : 'https://gateway.watsonplatform.net/visual-recognition-beta/api',
	username : 'd1e4920c-e5ec-4cbd-9859-7d424e672e59',
	password : 'CCWBmmwG4TOU',
	version : 'v2-beta',
	version_date:'2015-12-02'
}, vcapServices.getCredentials('visual_recognition'));

function isNotEmpty(str) {
    return (str || str.length > 0);
}

var readServicesAndCredentials = function() {    
    // keep a copy of the doc so we know its revision token
    var appEnv = cfenv.getAppEnv();
    //console.log("########################################### "+appEnv.services.toString());
     if (isNotEmpty(appEnv.services)) {
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        //console.log("Data:",appEnv.services);
        var cred = {
        "ttsUsername": appEnv.services.text_to_speech[0].credentials.username,
        "ttsPassword": appEnv.services.text_to_speech[0].credentials.password,
        "sttUsername": appEnv.services.speech_to_text[0].credentials.username,
        "sttPassword": appEnv.services.speech_to_text[0].credentials.password,
        "appURI": appEnv.url,
        "endpointDialog": "/talk",
        "endpointRR": "/talkRR"
        }
        console.log(cred);
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        return cred;
                
    }
    else{

        console.log("Data:","================================ Local settings required ========================================= : ");
        var cred = {
            "ttsUsername"   : "6f835df3-0673-409d-85c5-558a83cc045c",
            "ttsPassword"   : "IwX9neDVKXne",
            "sttUsername"   : "43d9ef6b-f84c-4888-b4ef-d576e0143aa3",
            "sttPassword"   : "ZOeGXrQ0Kw9Y",
            "appURI"        : "",
            "endpointDialog": "/talk",
            "endpointRR"    : "/talkRR",
            "local"         : true
        }
        return cred;
    }
        
  };

router.get('/QRCode', function(req, res) {
	console.log(" Get the credentials for the Samrtphone App from the Cloud Foundry Environment");
	var results = readServicesAndCredentials();
		console.log(results);
		//if (results.cred.local == true) {
		//	res.json(data);
		//}
                for (var key in results){
                    console.log('---------------------------->'+key+ " = "+results[key]);                                           
                }
		res.json(results);
	
});

router.get('/allServices', function(req, res) {
	console.log("      >>  >>  >>  >>  >>  >>  >>  >>  Get all Servcies used in the Watson Maintenance App");
        var appEnv = cfenv.getAppEnv();
        var allServices = appEnv.services;
        //console.log('++++++++'+ JSON.stringify(allServices.services));   
        var resultArray = [];
        for (var key in allServices){
            resultArray.push({
                service : key,
                name    : allServices[key],
            });
        }        
        var result = {
            
            services : resultArray,
            all : allServices
        }
	res.json(result);
	
});


module.exports = { 
    router : router,
    dialogCred  : dialogCredentials,
    visuRecog   : visualRecogCredentials,
    allServicesAndCred : readServicesAndCredentials
}


