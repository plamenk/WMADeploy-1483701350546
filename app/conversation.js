// app/conversation.js

//Module dependencies

var express         = require('express');
var app             = express();
var bluemix         = require('../config/bluemix');
var vcapServices    = require('vcap_services');
var extend          = require('util')._extend;
var qs              = require('qs');
var watson          = require('watson-developer-cloud');
var utils         	= require('./utils.js');
var Q	            = require('q');


utils.logging(">> Watson --> Conversation ............... initiated");

var config = extend({
	url : "https://gateway.watsonplatform.net/conversation/api",
	username : "7cf4127c-4c2c-4f34-87ce-254cfc98423c",
	password : "gIntxFii2rIg",
	version	 : "v1",
	version_date: "2016-09-20"
}, vcapServices.getCredentials('conversation'));

var credentials = extend(config, bluemix.getServiceCreds('conversation'));
console.log("[-][-]Use Cred: " + JSON.stringify(credentials));
var conversation = watson.conversation(credentials);

function getAvailableDialogs() {
	var dialogs = [];
	var workspace_ids = process.env.WORKSPACE_IDS.split(",");
	var workspace_names = process.env.WORKSPACE_NAMES.split(",");
	for (var i = 0; i < workspace_ids.length; i++) {
		dialogs.push({
			name : workspace_names[i],
			dialog_id : workspace_ids[i]
		});
	}
	return dialogs;
}


function ask(question, responseRecord, callback) {
	var context = {};
	if (utils.isNotEmpty(responseRecord.conversation_id)) {
		context.conversation_id = responseRecord.conversation_id;
		context.system	= {
			"dialog_stack": [
				{
					"dialog_node": responseRecord.dialog_node
				}
			],
			"dialog_turn_counter": responseRecord.dialog_turn_counter,
			"dialog_request_counter": responseRecord.dialog_request_counter
		};
	}
	var inputMsg = {
		workspace_id	: responseRecord.dialog_id,
		input : { 
				text	: question
		},
		context		: context
	};
	var def = Q.defer();
	
	utils.logging("input message: " + JSON.stringify(inputMsg));
	conversation.message(inputMsg, function(err, response) {
		if (err) {
			utils.logging("error in conversation:\n" + JSON.stringify(err));
		    def.reject(err, responseRecord);
		}
		else {
			utils.logging("conversation.message response:\n" + JSON.stringify(response, null, 2));
			responseRecord.conversation_id = response.context.conversation_id;
			responseRecord.response = response.output.text;
			responseRecord.dialog_node = response.context.system.dialog_stack[0].dialog_node;
			responseRecord.dialog_turn_counter = response.context.system.dialog_turn_counter;
			responseRecord.dialog_request_counter = response.context.system.dialog_request_counter;
			responseRecord.confidence = response.intents[0].confidence;
			def.resolve(responseRecord);
		}
	});
	return def.promise.nodeify(callback);
}

/*
var responseRecord = utils.createResponseRecord();
responseRecord.dialog_id = "8ba8d17e-b2f2-4427-898e-23d1a4bd3604";
var def = Q.defer();
ask("hi", responseRecord, function (err, response){
	if (err) {
		utils.logging("err: " + err);
		utils.logging("response: " + JSON.stringify(response));
	}
	else {
		responseRecord = response;
		utils.logging("response: " + JSON.stringify(responseRecord));
	}
});
def.resolve();
def.promise;
*/




require('../config/error-handler')(app);
// export public functions
module.exports = {
    getAvailableDialogs : getAvailableDialogs,
	ask					: ask
}
