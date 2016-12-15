/*eslint-env node */
// app/routes.js

//Module dependencies

var express         = require('express');
var app             = express();
var bluemix         = require('../config/bluemix');
var vcapServices    = require('vcap_services');
var extend          = require('util')._extend;  
var watson          = require('watson-developer-cloud');
var router          = express.Router();


console.log('>> Watson --> Visual Recognition Service ............... initiated');

// Plamen: adapt credentials to the GA (v3) Visual Recognition service		   
var config = extend({
	url : 'https://gateway-a.watsonplatform.net/visual-recognition/api',
	api_key : 'c146b8b1f6182225ba8209ec44974ac0143fd61e',
	version : 'v3',
	version_date : '2016-05-20'
}, vcapServices.getCredentials('watson_vision_combined'));

var credentials = extend(config, bluemix.getServiceCreds('watson_vision_combined'));
console.log('============================================ > > > >    '+JSON.stringify(credentials,null,2));
var visualRecognition = watson.visual_recognition(credentials);

require('../config/error-handler')(app);
// export public functions
module.exports = { 
    router : router,
    visualRecognition : visualRecognition
}










