var express         = require('express');
var app             = express();
var bluemix         = require('../config/bluemix');
var vcapServices    = require('vcap_services');
var extend          = require('util')._extend;  
var watson          = require('watson-developer-cloud');
var router          = express.Router();
var cfenv           = require('cfenv');
var utils           = require('./utils.js');
var url				= require('url');



utils.logging('>> Credentials ....................... will be loaded');



var readServicesAndCredentials = function() {    
    // keep a copy of the doc so we know its revision token
    var appEnv = cfenv.getAppEnv();
    console.log("########################################### "+ utils.isNotEmpty(appEnv.services));
     if (Object.keys(appEnv.services).length) {
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        console.log("Data:",JSON.stringify(appEnv.services));
        var cred = {
        "ttsUsername": appEnv.services.text_to_speech[0].credentials.username,
        "ttsPassword": appEnv.services.text_to_speech[0].credentials.password,
        "sttUsername": appEnv.services.speech_to_text[0].credentials.username,
        "sttPassword": appEnv.services.speech_to_text[0].credentials.password,
        "appURI": url.parse(appEnv.url).hostname,
        "endpointDialog": "/watson/talk",
        "endpointRR": "/watson/talkRR",
		"endpointPhoto": "/watson/api/photo"
        };
		
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
            "endpointDialog": "/watson/talk",
            "endpointRR"    : "/watson/talkRR",
			"endpointPhoto": "/watson/api/photo",
            "local"         : true
        }
        return cred;
    }
        
  };

router.get('/QRCode', function(req, res) {
	console.log(" Get the credentials for the Smartphone App from the Cloud Foundry Environment");
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
//    visuRecog   : visualRecogCredentials,
    allServicesAndCred : readServicesAndCredentials
}


