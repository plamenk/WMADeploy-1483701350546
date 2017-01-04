/*eslint-env node */
// app/routes.js

//Module dependencies

var express         = require('express');
var fs              = require("fs");
var app             = express();
var bluemix         = require('../config/bluemix');
var vcapServices    = require('vcap_services');
var extend          = require('util')._extend;  
var watson          = require('watson-developer-cloud');
var router          = express.Router();
var utils         	= require('./utils.js');
var Q	            = require('q');

var visuScoreTreshold	= 0.2;


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


function classify(file, availableDialogs, callback){

		var def = Q.defer();
		var vparams = {
				images_file		: fs.createReadStream(file.path),
				classifier_ids 	: [],
				threshold 		: visuScoreTreshold
		};
		var visuClassifier = {};
		visualRecognition.classify(vparams, function(err, results) {
			if (err){
				utils.logging("error in visu recognition classify:\n" + JSON.stringify(err));
				def.reject(err, results);
			}
			else {
				var visuResult = results;
				visuClassifier.score = 0;
				var classifiers = visuResult.images[0].classifiers;
				utils.logging("visuResult:\n" + JSON.stringify(visuResult,null,2));
				//utils.logging("classifiers:\n" + JSON.stringify(classifiers));
				for (var c in classifiers) {
					for (var j in classifiers[c].classes) {
						utils.logging(classifiers[c].classes[j].class +"       "+ classifiers[c].classes[j].score*100);
						for (var i=0; i< availableDialogs.length;i++){
						   if(classifiers[c].classes[j].class.toLowerCase() === availableDialogs[i].name.toLowerCase() && classifiers[c].classes[j].score*100 > visuClassifier.score ){
							   visuClassifier.dialog_id = availableDialogs[i].dialog_id;
							   visuClassifier.name = classifiers[c].classes[j].class;
							   visuClassifier.score = classifiers[c].classes[j].score*100;
							   isVorhanden = true;
						  }
						}
				  }
				}
				if(utils.isEmpty(visuClassifier.dialog_id)){
					utils.logging("No Conversation for that picture identified.");
				}
				def.resolve(visuClassifier);
		   }
		});
		return def.promise.nodeify(callback);

}



require('../config/error-handler')(app);
// export public functions
module.exports = { 
    router : router,
    classify : classify
}










