/*eslint-env node, express*/
// app/routes.js

//Module dependencies
var express             = require('express');
var app                 = express();
var fs                  = require('fs');
var multer              = require('multer');
var bluemix             = require('../config/bluemix');
var extend              = require('util')._extend;
var watson              = require('watson-developer-cloud');
var router              = express.Router();
var Q                   = require("q");
var dbCloudant          = require('./cloudantdb');
var visuRecogService    = require('./visuRecognitionService.js');
var credentials         = require('./AMAcredentials.js');
var rrService           = require('./rankAndRetrieve.js');
var qs                  = require('qs');
var visuScoreTreshold	= 0.2;


console.log('>> Watson --> REST Service ............... initiated');

// if bluemix credentials exists, then override local
/*
var credentials_old = extend({
	url : 'https://gateway.watsonplatform.net/dialog/api',
	username : '0098118f-ef20-4b59-b17b-57b20a2a5ab6',
	password : 'M5PN1YONlPzq',
	version : 'v1'
}, bluemix.getServiceCreds('dialog')); // VCAP_SERVICES
*/

var _id ='';        
var dialog_id ='';
                           
var jdDialog = {};
var availableDialogs = [];
//var dialog = watson.dialog(credentials);
var dialog = watson.dialog(credentials.dialogCred);
dialog.getDialogs( {} , function(err, dialogs) {
	if (err)
		console.log(err);
	else{		
		console.log("Anzahl dialogs: "+dialogs.dialogs.length);
		for (var i=0; i<dialogs.dialogs.length;i++){
			console.log("Name: "+dialogs.dialogs[i].name+ "    Dialog ID: "+dialogs.dialogs[i].dialog_id);                       
			availableDialogs.push(dialogs.dialogs[i]);                             
		}		
                jdDialog =  dialogs.dialogs[1];               
		return dialogs;	
	}
});


router.get('/servicename', function(req,res){
	console.log("request Servicename");
	var result = {};
	result.servicename = jdDialog.name;
	result.dialog = jdDialog;
        console.log(">> DIALOG_ID -----------> "+jdDialog.dialog_id);
	res.json(result);
});


router.post('/conversation', function(req, res, next) {	
var params = extend({
    dialog_id : jdDialog.dialog_id,
}, req.body);
console.log(" --> TTL INPUT     = "+req.body.input);
console.log(" --> TTL DIALOG_ID = "+params.dialog_id);

    dialog.conversation(params, function(err, results) {
	if (err){
            console.log(err);
	return next(err);
	}
	else{
            console.log("Output: " + results);
            res.json({
		dialog_id : dialog_id,                         
		conversation : results,
		connected : true
            });
	}
    });
});


var closeIssue = function dbcloseIssue(_id){
        var def = Q.defer(); 
        
        dbCloudant.dbs.jdMessagesDB.get(_id, { revs_info: true }, function(err, doc) {
        if(err){
            console.log("Fehler beim laden von Daten aus DB: "+err);                            
            def.reject({statusClose:'Fehler'}); 
        }
        if (!err) {                                            
            doc.status = 'close' ;           
            dbCloudant.dbs.jdMessagesDB.insert(doc, doc._id, function(err, doc) {
               if(err) {
                    console.log("Fehler beim updaten von status Attribute in DB: "+err);                            
                    def.reject({statusClose:'Fehler'}); 
               }
               else{
                    console.log("Status FLAG auf CLOSE Gesetzt für "+_id);
                    def.resolve({statusClose:'OK'}); 
               }
            });                                            
      }        
      });
     return def.promise;
 };
      



function isEmpty(str) {
    return (!str || 0 === str.length);
}

router.post('/talk', function(req, res, next) {	    
console.log('=====  '+JSON.stringify(req.body));    
dialog.conversation(req.body, function(err, results) {
	if (err){
            console.log(err);
	    
            var watsonDialog = {
                   conversation_id : results.conversation_id,
                   client_id       : results.client_id,
                   response        : 'Please repeat your question. Maybe the service is not available',
                   dialog_id       : req.body.dialog_id
            };               
            console.log("Output: " + watsonDialog.response+ "   "+ watsonDialog.client_id+ "   "+ watsonDialog.conversation_id+"   "+watsonDialog.dialog_id);
            res.json(watsonDialog);
            
	}
	else{            
            console.log("_ID = "+_id);                             
            if(isEmpty(_id) || (!isEmpty(_id) && !contains(results.response,'Problem record will be closed'))){
            var watsonDialog = {
                   conversation_id : results.conversation_id,
                   client_id       : results.client_id,
                   response        : results.response,
                   dialog_id       : req.body.dialog_id
            };               
            console.log("Output: " + watsonDialog.response+ "   "+ watsonDialog.client_id+ "   "+ watsonDialog.conversation_id+"   "+watsonDialog.dialog_id);
            res.json(watsonDialog);
            }
            else{
                // Variable auf Close setzen
            closeIssue(_id);
                
            var watsonDialog = {
                   conversation_id : results.conversation_id,
                   client_id       : results.client_id,
                   response        : results.response,
                   dialog_id       : req.body.dialog_id
            };               
            console.log("Output: " + watsonDialog.response+ "   "+ watsonDialog.client_id+ "   "+ watsonDialog.conversation_id+"   "+watsonDialog.dialog_id);
            res.json(watsonDialog);

            }
            
            
	}
    });
});




router.get('/talkRR', function(req, res) {

        var params = {
            cluster_id      : req.body.cluster_id,
            collection_name : req.body.collection_name,
            wt              : 'json'
        }; 
        
        var solrClient = rrService.retrieve_and_rank.createSolrClient(params);
        var ranker_id =  req.body.ranker_id;
        var question  = 'q='+req.body.query;
        var query     = qs.stringify({q: question, ranker_id: ranker_id, fl: 'id,title,body'});
        solrClient.get('fcselect', query, function(err, searchResponse) {
            if(err) {
              console.log('Error searching for documents: ' + err);
              
            var watsonRanker = {
                    cluster_id      : req.body.cluster_id,
                    collection_name : req.body.collection_name,
                    ranker_id       : req.body.ranker_id,
                    err_msg         : 'no document returned, please check the ranker service',
                    docs            : null
            };               
            res.json(watsonRanker);
            
            }
              else {
                //console.log(JSON.stringify(searchResponse.response.docs, null, 2));
                var docList = [];
                for (var i=0; i<searchResponse.response.docs.length; i++ ){
                    var dok = searchResponse.response.docs[i];
                    var newDoc = {
                        id: dok.id,
                        title: dok.title[0],
                        body: dok.body[0]
                    };
                    docList.push(newDoc);
                    
                }
                var watsonRanker = {
                    cluster_id      : data7.RRData.cluster_id,
                    collection_name : data7.RRData.RRData.params.classifier,
                    ranker_id       : data7.ranker_id,
                    err_msg         : '',
                    docs            : docList
               }; 
                res.json(watsonRanker);
              }
        });               
        
        //res.json(result);
	
});


router.post('/profile', function(req, res, next) {
	console.log("--> Profile called = "+req.params);
	var params = extend({
		dialog_id : jdDialog.dialog_id
	}, req.body);
	dialog.getProfile(params, function(err, results) {
		if (err)
			return next(err);
		else{
			console.log("PROFILE: "+results);
			res.json(results);
		}
	});
});

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var storage =   multer.diskStorage({
      destination: './uploads/',
//    destination: function (req, file, callback) {
//    callback(null,__dirname + '/uploads');
//  },
  filename: function (req, file, callback) {    
      //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "+file.originalname);
      //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "+file.encoding);
      //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "+file.fieldname);
      //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> "+file.mimetype);    
      if(file.mimetype === 'image/jpeg'){
            //callback(null, file.originalname + '-' + Date.now()+".jpg");
            callback(null, Date.now() + '-' + file.originalname);
      }
      if (file.mimetype === 'image/png'){
          //callback(null, file.originalname + '-' + Date.now()+".png");
          callback(null,  Date.now() + '-' + file.originalname);
      }
  }
});




function contains(r,s){
    var baseStr = r.toString();
    var ind = baseStr.indexOf(s);
    
    console.log("---------------- CONTAINS: "+r+"    "+s+"       "+ind);
    return ind > -1;
}

var upload = multer({ storage : storage}).single('watsonImg');


router.post('/api/photo',function(req,res){
    
    var file = null;
    var vparams = {};
    var visuResult = {};
    var watsonClassifier = {};
        watsonClassifier.problemart = 'start_demo_1';
        watsonClassifier.dialogID   = '';
    var watsonDialog = {};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////   
            
   
var promise1 = function uploadPic(){
        var def = Q.defer();
        var start = new Date().getTime();
        upload(req,res,function (err) {
        if(err) {
            def.reject("Failed to get answers from Watson");  
            res.json({   
                                  classifier : 'No Dialog for that picture identified',   
                                  usage :  0,
                                  score: '0',
                                  inventurnummer: '',
                                  response: 'please make a new Photo. Maybe the service is not available',
                                  dialog_id: ''
            }); 
        }
        else{
            var file = req.file;    
            console.log('==================================================================== >  >>>>>>>>>   '+req.file.originalname + "       " + req.body._id );
			var vparams = {
                    images_file: fs.createReadStream(req.file.path)
            };
            var _id = req.body._id;
            def.resolve({file: file, _id: _id, problemart : 'electrical', vparams: vparams});    
                               
        }     
        });
        var end = new Date().getTime();
        var time = end - start;
        console.log('============================ Time to Receive File and _ID Execution time: ' + time);        
        return def.promise;
    };
    
    
    
    
     
 var promise2 = function dbProcessProblem(data){
        var def = Q.defer(); 
        var start = new Date().getTime();
        dbCloudant.dbs.jdMessagesDB.get(data.data0._id, { revs_info: true }, function(err, doc) {
        if(err){
            console.log("Fehler beim laden von Daten aus DB: "+err);                            
            def.reject("Failed to get answers from Watson"); 
            res.json({   
                              classifier : 'No Dialog for that picture identified',   
                              usage :  0,
                              score: '0',
                              inventurnummer: '',
                              response: 'please make a new Photo. Maybe the service is not available',
                              dialog_id: ''
                        }); 
        }
        if (!err) {                                            
            var data0 = {
                problemart : doc.problemart,
                _id        : data.data0._id,
                vparams    : data.data0.vparams
            };
            doc.processed = true ;           
            dbCloudant.dbs.jdMessagesDB.insert(doc, doc._id, function(err, doc) {
               if(err) {
                  def.reject("Failed to get answers from Watson");            
                   res.json({   
                                  classifier : 'No Dialog for that picture identified',   
                                  usage :  0,
                                  score: '0',
                                  inventurnummer: '',
                                  response: 'please make a new Photo. Maybe the service is not available',
                                  dialog_id: ''
                            });                  
               }
               else{
                    def.resolve({data0:data0}); 
               }
            });                                            
      }        
      });
     return def.promise;
    };
 
           var promise3 = function watsonVisuRecog(data2){  
           var watsonClassifier = {}; 
			var def = Q.defer(); 
   	// Plamen: extend query parameters by custom classifiers		   
			data2.data0.vparams.classifier_ids = null;
			data2.data0.vparams.threshold = visuScoreTreshold;
                 visuRecogService.visualRecognition.classify(data2.data0.vparams, function(err, results) {
                        if (err){
                            console.log("Fehler bei Watson Visu Recog: "+err);                            
                            def.reject("Failed to get answers from Watson"); 
                            res.json({   
                                  classifier : 'No Dialog for that picture identified',   
                                  usage :  0,
                                  score: '0',
                                  inventurnummer: '',
                                  response: 'please make a new Photo. Maybe the service is not available',
                                  dialog_id: ''
                            }); 
                        }
                        else{
                          visuResult = results;              
                          watsonClassifier.score = 0;
   	// Plamen: adjust answer structure processing and determine the class with the highest score matching an existing dialog		   
                          var classifiers = visuResult.images[0].classifiers; 
console.log('visuResult:\n' + JSON.stringify(visuResult,null,2));
console.log('classifiers:\n' + JSON.stringify(classifiers));
                          for (var c in classifiers) {
							  for (var j in classifiers[c].classes) {
console.log(classifiers[c].classes[j].class +"       "+ classifiers[c].classes[j].score*100);								  
                                        for (var i=0; i<availableDialogs.length;i++){
                                               if(classifiers[c].classes[j].class.toLowerCase() == availableDialogs[i].name.toLowerCase() && (classifiers[c].classes[j].score*100 > watsonClassifier.score) ){
                                                   watsonClassifier.dialogID = availableDialogs[i].dialog_id;
                                                   watsonClassifier.name = classifiers[c].classes[j].class;
                                                   watsonClassifier.score = classifiers[c].classes[j].score*100;
                                                   dialog_id = availableDialogs[i].dialog_id;
                                                   isVorhanden = true;
                                              } 
                                        }		                                
							  }
						  }
                          def.resolve({watsonClassifier : watsonClassifier, data2: data2}); 

                        if(watsonClassifier.dialogID == undefined || watsonClassifier.dialogID ==  null || watsonClassifier.dialogID == ''){
                            res.json({   
                                  classifier : 'No Dialog for that picture identified',   
                                  usage :  0,
                                  score: '0',
                                  inventurnummer: '',
                                  response: 'please make a new Photo',
                                  dialog_id: ''
                            });                                  
                        }
                       }
                         
                    });
                  return def.promise;
            
           };
    
    
           var promise4 = function watsonDialogFirst(data3){  
               var def = Q.defer();                         
                        dialog.conversation({input : data3.data2.data0.problemart, dialog_id : data3.watsonClassifier.dialogID}, function(err, results) {
                            if (err){
                               console.log("Fehler bei WatsonDialog 1: "+err); 
                               def.reject("Failed to get answers from Watson");                                 
                               res.json({   
                                  classifier : 'No Dialog for that picture identified',   
                                  usage :  0,
                                  score: '0',
                                  inventurnummer: '',
                                  response: 'please make a new Photo. Maybe the service is not available',
                                  dialog_id: ''
                                }); 
                            }
                            else{ 
                            var params = {
                                        dialog_id       : data3.watsonClassifier.dialogID,
                                        dialog_name     : results.name,
                                        conversation_id : results.conversation_id,
                                        client_id       : results.client_id,
                                        response        : results.response
                           };
                        
                            
                            var inputNext = {
                              conversation_id: results.conversation_id,
                              dialog_id: data3.watsonClassifier.dialogID,
                              client_id: results.client_id,
                              input:     data3.data2.data0.problemart
                            };


                          def.resolve({params : params, inputNext: inputNext, data3: data3});                                                                      
                      }
                 });
               return def.promise;
            };   
            
           var promise5 = function watsonDialogGeneral(dialogData){  
               console.log("Now I'm in Promise 5 : YippyYeah");
               console.log(JSON.stringify(dialogData.inputNext));
               var def = Q.defer();                            
                        dialog.conversation(dialogData.inputNext
                             /* {
                              conversation_id: dialogData.inputNext.conversation_id,
                              dialog_id: dialogData.inputNext.dialogID,
                              client_id: dialogData.inputNext.client_id,
                              input: dialogData.inputNext.input}
                              }*/
                              , function(err, results) {
                            if (err){
                               console.log("Fehler bei WatsonDialog 2: "+err); 
                               def.reject("Failed to get answers from Watson");   
                                res.json({   
                                  classifier : 'No Dialog for that picture identified',   
                                  usage :  0,
                                  score: '0',
                                  inventurnummer: '',
                                  response: 'please make a new Photo. Maybe the service is not available',
                                  dialog_id: ''
                                });                                
                            }
                            else{ 
                                console.log("Dialog successful");
                            /*var params1 = {
                                        conversation_id : results.conversation_id,
                                        client_id       : results.client_id,
                                        response        : results.response,
                                        dialog_id       : dialogData.data3.watsonClassifier.dialogID,
                                        dialog_name     : dialogData.data3.watsonClassifier.name
                            }*/     
                           
                           
                           var params = {   
                                classifier : dialogData.data3.watsonClassifier.name,   
                                usage :  1,
                                score:   dialogData.data3.watsonClassifier.score,
                                inventurnummer: '23233-23dqd23-dqe121',
                                response: results.response,
                                dialog_id: dialogData.data3.watsonClassifier.dialogID,
                                conversation_id : results.conversation_id,
                                client_id       : results.client_id,
                                };
                                                                                             
                             def.resolve({params:params});                                                                      
                      }
                 });
               return def.promise;
            };   
            
            
            
            
             var promise6 = function watsonRRClusterID(RRData){    // Rank & Retrieve
               
               console.log("Now I'm in Promise 6 for the RANK & RETRIEVE Service --> CLUSTER_ID ");              
               var def = Q.defer();   
               
               rrService.retrieve_and_rank.listClusters({},
                        function (err, response) {
                        if (err){
                            console.log('error:', err);
                            var params = {   
                                 RRData : RRData,   
                                 cluster_id :  00000000000
                                 };
                            def.reject(params);                                   
                          }
                          else{
                            console.log("********* CLUSTER NAMES : ***************");   
                            //console.log(JSON.stringify(response, null, 2));
                            //var clusterInfo = JSON.stringify(response);
                            // HIER MUSS ICH NOCH ÜBERPRÜFEN OB DER CLUSTERNAME == DIALOGNAME::: IST
                            var params = {   
                                 RRData : RRData,   
                                 cluster_id :  response.clusters[0].solr_cluster_id
                                 };

                            def.resolve(params);                              
                        }
                      });
                return def.promise;                
              };   
              
              
              var promise7 = function watsonRRRankID(RRData){    // Rank & Retrieve
               
               console.log("Now I'm in Promise 7 for the RANK & RETRIEVE Service --> RANKER_ID ");
               console.log(RRData);
               console.log(RRData.RRData.params.classifier);
               var def = Q.defer();   
               
               
               rrService.retrieve_and_rank.listRankers({},
                    function(err, response) {                  
                      if (err){                          
                        console.log('error:', err);
                        var params = {   
                            RRData : RRData,   
                            ranker_id :  00000000000
                        };
                        def.reject(params);    
                      }
                      else{
                        //console.log(JSON.stringify(response, null, 2));
                        var rankerArray = response.rankers;
                        var params = {   
                            RRData : RRData,   
                            ranker_id :  00000000000
                        };                        
                        for (var i = 0; i < rankerArray.length; i++){
                            // look for the entry with a matching `code` value
                            console.log(rankerArray[i]);
                            if (rankerArray[i].name == RRData.RRData.params.classifier){
                               // we found it
                              // obj[i].name is the matched result
                              console.log('FOUND = '+JSON.stringify(rankerArray[i]));
                              params.ranker_id = rankerArray[i].ranker_id;
                              console.log('Params to Return = '+JSON.stringify(params));
                            }
                              //break;
                        }
                        def.resolve(params);    
                     }
                  });


                return def.promise;                
              };   
              
              
              
              
              
              
              
            
        
    Q.all([promise1()]).then(function(data) {
        console.log("1. Bild uploaden ");
        var data0 = data[0];
        return { data0 : data0};
        
    }).then(function(data1){
        console.log("2. DB process auf true setzten und problemart hole");
        console.log("  --> _ID = "+data1.data0._id);
        if(data1.data0._id == undefined || data1.data0._id ==  null || data1.data0._id == ''){
            return data1;
        }
        else{
            var prom2 = promise2(data1);
            return prom2;
        }
               
    }).then(function(data2){
        console.log("3. Visualrecognition aufrufen ");
        console.log("  --> Problemart = "+data2.data0.problemart);
        console.log("  --> _ID        = "+data2.data0._id);
        var prom3 = promise3(data2);
        return prom3;
    }).then(function(data3){       
        console.log("4. Dialog aufrufen ");
        console.log("  --> Dialod ID  = " + data3.watsonClassifier.dialogID);
        console.log("  --> Name       = " + data3.watsonClassifier.name);    
        console.log("  --> Score      = " + data3.watsonClassifier.score);
        console.log("  --> Problemart = " + data3.data2.data0.problemart);
        console.log("  --> _ID        = " + data3.data2.data0._id);       
       var prom4 = promise4(data3);
       return prom4;        
    }).then(function(data4){
        console.log("5. Final den Dialog mit Client_ID, Conversation_ID, Dialog_ID starten ");
        console.log("  --> Watsons Antwort  = " + data4.params.response);   
        console.log("  --> Dialog Name      = " + data4.data3.watsonClassifier.name);    
        console.log("  --> Score            = " + data4.data3.watsonClassifier.score);
        console.log("  --> Problemart       = " + data4.data3.data2.data0.problemart);
        console.log("  --> _ID              = " + data4.data3.data2.data0._id);
        console.log("  --> Conversation_ID  = " + data4.inputNext.conversation_id);  
        console.log("  --> Client_ID        = " + data4.inputNext.client_id);  
        console.log("  --> Input Next Dialog= " + data4.inputNext.input);  
        console.log("  --> Dialod ID        = " + data4.data3.watsonClassifier.dialogID);
        conversation_id = data4.inputNext.conversation_id;
        client_id       = data4.inputNext.client_id;

        
        var prom5 = promise5(data4);
        return prom5;
    }).then(function(data5){
        var prom6 = promise6(data5);
        return prom6;
    
    }).then(function(data6){
        
        console.log("6. R&R ermitteln ");       
        console.log("  --> Watsons Antwort  = " + data6.RRData.params.response);   
        console.log("  --> dialog_id        = " + data6.RRData.params.dialog_id);  
        console.log("  --> score            = " + data6.RRData.params.score);  
        console.log("  --> classifier       = " + data6.RRData.params.classifier);         
        console.log("  --> Cluster_id  = " + data6.cluster_id);   
         
        var prom7 = promise7(data6);
        return prom7;
    
    }).then(function(data7){     
        console.log("7. R&R Ranker_ID ermittelt ");    
        console.log('Ranker ID          = '+data7.ranker_id);    
        console.log('Cluster ID         = '+data7.RRData.cluster_id);    
        console.log('Collection Name    = '+data7.RRData.RRData.params.classifier);
        console.log('Query              = '+data7.RRData.RRData.params.response[0]);    
        
        if(data7.RRData.RRData.params.score > 50){
            
        /*
        var params = {
            cluster_id: data7.RRData.cluster_id,
            collection_name: data7.RRData.RRData.params.classifier,
            wt: 'json'
        };    
        
        console.log('Searching all documents.............................................................................................'+ JSON.stringify(params));
        var solrClient = rrService.retrieve_and_rank.createSolrClient(params);
        var ranker_id = data7.ranker_id; //'3b140ax15-rank-3098';
        var question  = 'q='+data7.RRData.RRData.params.response[0];
        var query     = qs.stringify({q: question, ranker_id: ranker_id, fl: 'id,title,body'});
        solrClient.get('fcselect', query, function(err, searchResponse) {
            if(err) {
              console.log('Error searching for documents: ' + err);
            }
              else {
                console.log('****************** ERGEBNIS DER fcselect ************');
                console.log('');
                console.log(JSON.stringify(searchResponse.response.docs, null, 2));
                console.log('');                
                console.log('******************************');
                console.log('************** Aufgesplittet ****************');
                console.log('');
                var docList = [];
                for (var i=0; i<searchResponse.response.docs.length; i++ ){
                    var dok = searchResponse.response.docs[i];
                    var newDoc = {
                        id: dok.id,
                        title: dok.title[0],
                        body: dok.body[0]
                    }
                    docList.push(newDoc);
                    
                }
               //console.log(docList);
               var watsonRanker = {
                    cluster_id      : data7.RRData.cluster_id,
                    collection_name : data7.RRData.RRData.params.classifier,
                    ranker_id       : data7.ranker_id,
                    docs            : docList
               } 
               console.log(watsonRanker);
              }
        });
        */
        res.json({  
                     classifier         : data7.RRData.RRData.params.classifier,   
                     usage              :  1,
                     score              :data7.RRData.RRData.params.score,
                     inventurnummer     : '23233-23dqd23-dqe121',
                     response           : data7.RRData.RRData.params.response[0] ,
                     dialog_id          : data7.RRData.RRData.params.dialog_id,
                     conversation_id    : data7.RRData.RRData.params.conversation_id,
                     client_id          : data7.RRData.RRData.params.client_id,
                     cluster_id         : data7.RRData.cluster_id,
                     collection_name    : data7.RRData.RRData.params.classifier,
                     ranker_id          : data7.ranker_id
             });                                        
             }
        else{
             res.json({   
                   classifier           : data7.RRData.RRData.params.classifier,   
                   usage                :  0,
                   score                : '0',
                   inventurnummer       : '23233-23dqd23-dqe121',
                   response             : 'please make a new Photo',
                   dialog_id            : data7.RRData.RRData.params.dialog_id,
                   conversation_id      : data7.RRData.RRData.params.conversation_id,
                   client_id            : data7.RRData.RRData.params.client_id
             });                                        
        }               
    });
    
    
    
    
    
    
    
});



// error-handler settings
require('../config/error-handler')(app);

// export public functions
module.exports = router;

  