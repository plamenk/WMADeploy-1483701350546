/*eslint-env node, express*/
// app/routes.js

//Module dependencies
var express             = require("express");
var app                 = express();
var multer              = require("multer");
var bluemix             = require("../config/bluemix");
var mergeJSON 			= require("merge-json") ;
var watson              = require("watson-developer-cloud");
var router              = express.Router();
var Q                   = require("q");
var dbCloudant          = require("./cloudantdb");
var visuRecogService    = require("./visuRecognitionService.js");
var credentials         = require("./AMAcredentials.js");
var rrService           = require("./rankAndRetrieve.js");
var conversation        = require("./conversation.js");
var qs                  = require("qs");
var async	            = require("async");
var utils	            = require("./utils.js");
var utils	            = require("./utils.js");
var rankAndRetrieve     = require("./rankAndRetrieve.js");

require('dotenv').config({ silent: true });


//Plamen: temporary stateful until getting the new app
var HashTable = require('hashtable');
global.responseRecord_HT = new HashTable();
global.conversation_int_id_HT = new HashTable();




// not used here
var closeIssue = function dbcloseIssue(_id){
        var def = Q.defer();

        dbCloudant.dbs.jdMessagesDB.get(_id, { revs_info: true }, function(err, doc) {
			if(err){
				utils.logging("Fehler beim laden von Daten aus DB: "+err);
				def.reject({statusClose:"Fehler"});
			}
			else {
				doc.status = "close" ;
				dbCloudant.dbs.jdMessagesDB.insert(doc, doc._id, function(err, doc) {
				   if(err) {
						console.log("Fehler beim updaten von status Attribute in DB: "+err);
						def.reject({statusClose:"Fehler"});
				   }
				   else{
						console.log("Status FLAG auf CLOSE Gesetzt für "+_id);
						def.resolve({statusClose:"OK"});
				   }
				});
			}
		});
		return def.promise;
 };


 



router.post("/talk", function(req, res, next) {
	utils.logging("talk Question:\n" + JSON.stringify(req.body));

	var asyncTasks = [];

	var responseRecord = req.body;
	responseRecord.response = "No answer found. Are you sure that you have trained the services?";

	utils.logging("responseRecord: \n" + JSON.stringify(responseRecord));
	
	//Plamen: temporary stateful until getting the new app
	if (!isNaN(responseRecord.conversation_id)) {
		responseRecord.conversation_int_id = responseRecord.conversation_id;
		responseRecord.conversation_id = global.conversation_int_id_HT.get(responseRecord.conversation_id).conversation_id;
	}
	
	var rRec = global.responseRecord_HT.get(responseRecord.conversation_id);
	utils.logging("rRec: " + JSON.stringify(rRec));
	if (utils.isEmpty(responseRecord.dialog_id) && (rRec !== undefined))
		responseRecord.dialog_id = rRec.dialog_id;
	if (utils.isEmpty(responseRecord.dialog_node) && (rRec !== undefined))
		responseRecord.dialog_node = rRec.dialog_node;
	if (utils.isEmpty(responseRecord.dialog_turn_counter) && (rRec !== undefined))
		responseRecord.dialog_turn_counter = rRec.dialog_turn_counter;
	if (utils.isEmpty(responseRecord.dialog_request_counter) && (rRec !== undefined))
		responseRecord.dialog_request_counter = rRec.dialog_request_counter;
	if (utils.isEmpty(responseRecord.collection_name) && (rRec !== undefined))
		responseRecord.collection_name = rRec.collection_name;
	if (utils.isEmpty(responseRecord.ranker_id) && (rRec !== undefined))
		responseRecord.ranker_id = rRec.ranker_id;
	if (utils.isEmpty(responseRecord.cluster_id) && (rRec !== undefined))
		responseRecord.cluster_id = rRec.cluster_id;
	utils.logging("responseRecord: \n" + JSON.stringify(responseRecord));

	
	// add  default answer
	asyncTasks.push(function(callback) {
		callback (null, responseRecord);
		});


	// call conversation, if available
	if (utils.isNotEmpty(responseRecord.dialog_id) && utils.isNotEmpty(responseRecord.conversation_id)) {
		asyncTasks.push(function(callback) {
			conversation.ask(req.body.input, responseRecord, function (err, response) {
				utils.logging("Output from Conversation:\n" + JSON.stringify(response));
				var newResponse;
				if (err){
					utils.logging("error in talk.ask" + JSON.stringify(err));
					var intErrJson = { internalError 	: err.message };
					newResponse = mergeJSON.merge(response, intErrJson); 
				}
				else {
					utils.logging("   talk:response" + JSON.stringify(response));
					newResponse = response;

	//Plamen: temporary stateful until getting the new app
	global.responseRecord_HT.get(newResponse.conversation_id).dialog_node = newResponse.dialog_node;

	}
	
					callback(err, newResponse);
			});
		});
	}

		
	// call R&R ranked search
	if (utils.isNotEmpty(responseRecord.cluster_id) && utils.isNotEmpty(responseRecord.collection_name)) {
		// search & rank, if ranker exists
		if (utils.isNotEmpty(responseRecord.ranker_id)) {
			asyncTasks.push(function(callback) {
				rrService.searchAndRank(req.body.input, responseRecord, function (err, response) {
					utils.logging("Output from Ranked Search:\n" + JSON.stringify(response));
					var newResponse;
					if (err){
						utils.logging("error in talk.searchAndRank" + JSON.stringify(err));
						var intErrJson = { internalError 	: err.message };
						newResponse = mergeJSON.merge(response, intErrJson); 
					}
					else {
						//utils.logging("   talk:response" + JSON.stringify(response));
						newResponse = response;
					}
					callback(err, newResponse);
				});

			});
		}

		// call normal search (no ranker exists)
		else {
			asyncTasks.push(function(callback) {
				rrService.search(req.body.input, responseRecord, function (err, response) {
					utils.logging("Output from Normal Search:\n" + JSON.stringify(response));
					var newResponse;
					if (err){
						utils.logging("error in talk.search" + JSON.stringify(err));
						var intErrJson = { internalError 	: err.message };
						newResponse = mergeJSON.merge(response, intErrJson); 
					}
					else {
						newResponse = response;
					}
					callback(err, newResponse);
				});

			});
		}
	}
	


	async.parallel(asyncTasks, function(err, results) {
		var confidence = 0;
		for (var i=1; i < results.length; i++) {
			if (utils.isNotEmpty(results[i]) && (results[i].confidence > confidence))  {
				responseRecord.response = results[i].response;
				confidence = results[i].confidence;
				responseRecord.confidence = results[i].confidence;
			}
		}
	//Plamen: temporary stateful until getting the new app
		if (utils.isNotEmpty(responseRecord.conversation_int_id))
			responseRecord.conversation_id = responseRecord.conversation_int_id;
		
		res.json(responseRecord);
		return;
	});
});



router.post("/talkRR", function(req, res) {
	utils.logging("talkRR Question:\n" + JSON.stringify(req.body));

	var asyncTasks = [];

	var responseRecord = req.body;
	

	// call R&R ranked search
	if (utils.isNotEmpty(responseRecord.cluster_id) && utils.isNotEmpty(responseRecord.collection_name)) {
		// search & rank, if ranker exists
		if (utils.isNotEmpty(responseRecord.ranker_id)) {
			asyncTasks.push(function(callback) {
				rrService.searchAndRank(req.body.query, responseRecord, function (err, response) {
					utils.logging("Output from Ranked Search:\n" + JSON.stringify(response));
					var newResponse;
					if (err){
						utils.logging("error in talk.searchAndRank" + JSON.stringify(err));
						var intErrJson = { internalError 	: err.message };
						newResponse = mergeJSON.merge(response, intErrJson); 
					}
					else {
						//utils.logging("   talk:response" + JSON.stringify(response));
						newResponse = response;
					}
					callback(err, newResponse);
				});

			});
		}

		// call normal search (no ranker exists)
		else {
			asyncTasks.push(function(callback) {
				rrService.search(req.body.query, responseRecord, function (err, response) {
					utils.logging("Output from Normal Search:\n" + JSON.stringify(response));
					var newResponse;
					if (err){
						utils.logging("error in talk.search" + JSON.stringify(err));
						var intErrJson = { internalError 	: err.message };
						newResponse = mergeJSON.merge(response, intErrJson); 
					}
					else {
						//utils.logging("   talk:response" + JSON.stringify(response));
						newResponse = response;
					}
					callback(err, newResponse);
				});

			});
		}
	}
	
	async.parallel(asyncTasks, function(err, results) {

		for (var i=0; i < results.length; i++) {
			responseRecord.response = results[i].response;
			responseRecord.confidence = results[i].confidence;
			responseRecord.docs = results[i].docs;
		}
	//Plamen: temporary stateful until getting the new app
		if (utils.isNotEmpty(responseRecord.conversation_int_id))
			responseRecord.conversation_id = responseRecord.conversation_int_id;
		
		res.json(responseRecord);
		return;
	});
});



////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var storage =   multer.diskStorage({
      destination: "./uploads/",
//    destination: function (req, file, callback) {
//    callback(null,__dirname + '/uploads');
//  },
  filename: function (req, file, callback) {
      //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "+file.originalname);
      //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "+file.encoding);
      //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "+file.fieldname);
      //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "+file.mimetype);
      if((file.mimetype === "image/jpeg") || (file.mimetype === "image/png")){
            //callback(null, file.originalname + '-' + Date.now()+".jpg");
            callback(null, Date.now() + "-" + file.originalname);
      }
  }
});





var upload = multer({ storage : storage}).single("watsonImg");


router.post("/api/photo",function(req,res){

	
	var responseRecord = utils.createResponseRecord();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var promiseUploadPic = function uploadPic(responseRecord){
		var def = Q.defer();
		utils.logging("1. Photo upload");
		utils.logging("   uploadPic:responseRecord" + JSON.stringify(responseRecord));
		var start = new Date().getTime();
		upload(req,res,function (err) {
			responseRecord.req = {
				_id 	: req.body._id,
				file 	: req.file
			};
			if(err) {
				responseRecord.internalError = "Error uploading photo.";
				responseRecord.response = "Could not upload photo. Please make a new one.";
				def.reject(responseRecord,err);
			}
			else{
				utils.logging(">>>>>>>>>   "+ responseRecord.req.file.originalname + "       " + responseRecord.req._id );
				def.resolve(responseRecord);
				var end = new Date().getTime();
				var time = end - start;
				utils.logging(">>>>>>>>>    Time to Receive File and _ID Execution time: " + time);
			}
		});
		return def.promise;
	};




	// get reported issues 
	 var promiseGetIssues = function getIssues(responseRecord){
		var def = Q.defer();
		utils.logging("2. Get issues");
		utils.logging("   getIssues:responseRecord" + JSON.stringify(responseRecord));
		var start = new Date().getTime();
		//cloudantdb.readIssue(responseRecord.req._id, function(err, doc) {
		dbCloudant.dbs.jdMessagesDB.get(responseRecord.req._id, { revs_info: true }, function(err, doc) {
			//utils.logging("   doc: " + JSON.stringify(doc));
			if(err){
				responseRecord.internalError = "Error loading issues.";
				responseRecord.response = "Could not upload photo. Please make a new one.";
				def.reject(responseRecord, err);
			}
			else {
				responseRecord.issue = {
						problemart : doc.problemart
				};
				doc.processed = true ;
				dbCloudant.dbs.jdMessagesDB.insert(doc, doc._id, function(err, doc) {
				   if(err) {
						responseRecord.internalError = "Error inserting issue into DB.";
						responseRecord.response = "Could not upload photo. Please make a new one.";
						def.reject(responseRecord, err);
				   }
				   else {
						responseRecord.problemart = doc.problemart;
						if (doc.inventurnummer) responseRecord.inventurnummer = doc.inventurnummer;
						def.resolve(responseRecord);
				   }
				});
			}
		});
		return def.promise;
	};



	// visual recognition
    var promiseVisuRecogn = function visuRecogn(responseRecord){
		var def = Q.defer();
		utils.logging("3. Visual Recognition");
		utils.logging("   visuRecogn:responseRecord" + JSON.stringify(responseRecord));
		visuRecogService.classify(req.file, responseRecord.availableDialogs, function(err, result) {
			if (err){
				responseRecord.internalError = err.message;
				responseRecord.response = "Could not recognize photo. Please make a new one.";
				def.reject(responseRecord, err);
			}
			else {
				if (result !== null) {
					if (result.name) responseRecord.classifier = result.name;
					if (result.dialog_id) responseRecord.dialog_id = result.dialog_id;
					if (result.score) responseRecord.score = result.score;
				}
				def.resolve(responseRecord);
		   }
		});
		return def.promise;

	};


    var promiseConversation = function initConversation(responseRecord){
		var def = Q.defer();
		if (utils.isEmpty(responseRecord.dialog_id)) {

		//Plamen: temporary stateful until getting the new app
	//	global.responseRecord_HT.remove(responseRecord.conversation_id);
		responseRecord.conversation_int_id = Math.random() * 100000000000000000;
		responseRecord.conversation_id = String(responseRecord.conversation_int_id);
		global.conversation_int_id_HT.put(responseRecord.conversation_int_id, { "conversation_id" : responseRecord.conversation_id });
		global.responseRecord_HT.put(responseRecord.conversation_id, responseRecord);
			
			def.resolve(responseRecord);
		}
		else {
			utils.logging("4. Conversation");
			utils.logging("   conversation:responseRecord " + JSON.stringify(responseRecord));
			conversation.ask(process.env.HELLO, responseRecord, function (err, response) {
				if (err){
					utils.logging("error in conversation.ask" + JSON.stringify(err));
					responseRecord.internalError = err.message;
					responseRecord.response = "Could not recognize photo. Please make a new one.";
					def.reject(responseRecord);
				}
				else {
					utils.logging("   conversation:response" + JSON.stringify(response));
		//Plamen: temporary stateful until getting the new app
	//	global.responseRecord_HT.remove(responseRecord.conversation_id);
		responseRecord.conversation_int_id = Math.random() * 100000000000000000;
		global.conversation_int_id_HT.put(responseRecord.conversation_int_id, { "conversation_id" : responseRecord.conversation_id });
		global.responseRecord_HT.put(responseRecord.conversation_id, responseRecord);
		
					def.resolve(response);
				}
			});
		}
		return def.promise;
    };

 



// get R&R Cluster id
	var promiseGetCluster = function getCluster(responseRecord){    
		var def = Q.defer();
		utils.logging("5. Get R&R Cluster Id");
		utils.logging("   getCluster:responseRecord" + JSON.stringify(responseRecord));
		rankAndRetrieve.getClusterIdForName(responseRecord.classifier, function (err, response) {
			if (err){
				utils.logging("error in watsonRRClusterID" + JSON.stringify(err));
				responseRecord.internalError = err.message;
				responseRecord.response = "Could not recognize photo. Please make a new one.";
				def.reject(responseRecord);
			}
			else {
				utils.logging("   getCluster:response" + JSON.stringify(response));
				responseRecord.cluster_id = response;
	//Plamen: temporary stateful until getting the new app
/*	utils.logging("current responseRecord for: " + responseRecord.conversation_id + "\n" + JSON.stringify(global.responseRecord_HT.get(responseRecord.conversation_id)));
	utils.logging("HT remove: " + global.responseRecord_HT.remove(responseRecord.conversation_id));
	global.responseRecord_HT.put(responseRecord.conversation_id, responseRecord);
	utils.logging("HT put responseRecord done: " + JSON.stringify(responseRecord));
*/	
				def.resolve(responseRecord);
			}
		});
		return def.promise;
    };

// get R&R Collection name & Ranker id
	var promiseGetCollectionRanker = function getCollectionRanker(responseRecord){    
		var def = Q.defer();
		utils.logging("6. Get R&R Collection Name & Ranker Id");
		utils.logging("   getCollectionRanker:responseRecord" + JSON.stringify(responseRecord));
		rankAndRetrieve.getRankerIdAndCollectionForName(responseRecord.classifier, function (err, response) {
			if (err){
				utils.logging("error in getCollectionRanker" + JSON.stringify(err));
				responseRecord.internalError = err.message;
				responseRecord.response = "Could not recognize photo. Please make a new one. By the way, are you sure that you have a trained set of resources?";
				def.reject(responseRecord);
			}
			else {
				utils.logging("   getCollectionRanker:response" + JSON.stringify(response));
				responseRecord.collection_name = response.collection_name;
				responseRecord.ranker_id = response.ranker_id;
	//Plamen: temporary stateful until getting the new app
/*	global.responseRecord_HT.remove(responseRecord.conversation_id);
	global.responseRecord_HT.put(responseRecord.conversation_id, responseRecord);
*/
				def.resolve(responseRecord);
			}
		});
		return def.promise;
    };




	var onFullfilled = function(responseRecord) {
		utils.logging("+ Fullfilled Promises");
		utils.logging("   responseRecord" + JSON.stringify(responseRecord));
		responseRecord.promiseStatus = "fullfilled";
		responseRecord.response = String(responseRecord.response);

	//Plamen: temporary stateful until getting the new app
		if (utils.isNotEmpty(responseRecord.conversation_int_id)) {
			responseRecord.conversation_id = responseRecord.conversation_int_id;
		}
		
		res.json(responseRecord);
	};

	
	var onRejected = function(responseRecord) {
		utils.logging("- Rejected Promise");
		utils.logging("   responseRecord" + JSON.stringify(responseRecord));
		responseRecord.promiseStatus = "rejected";
		responseRecord.response = String(responseRecord.response);

	//Plamen: temporary stateful until getting the new app
		if (utils.isNotEmpty(responseRecord.conversation_int_id))
			responseRecord.conversation_id = responseRecord.conversation_int_id;
		
		res.json(responseRecord);
	};



	
	// upload photo & get available dialogs in parallel
    Q.all([promiseUploadPic(responseRecord),conversation.getAvailableDialogs()])
	.then(function(data) {
		var responseRecord = data[0];
		if (data.length > 1) {
			responseRecord.availableDialogs = data[1];
		};
		return responseRecord;
	})
	// get issues 
	.then(promiseGetIssues)
	
	// visual recognition
	.then(promiseVisuRecogn)
	
	// Conversation
	.then(promiseConversation)
	
	// Retrieve & Rank - get cluster
	.then(promiseGetCluster)
	
	// Retrieve & Rank - get collection & ranker
	.then(promiseGetCollectionRanker)
	
	// final clause
	.then(onFullfilled, onRejected);
	
	

});






// error-handler settings
require("../config/error-handler")(app);

// export public functions
module.exports = router;
