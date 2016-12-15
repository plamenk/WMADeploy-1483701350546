// app/routes.js

//Module dependencies

var express         = require('express');
var app             = express();
var bluemix         = require('../config/bluemix');
var vcapServices    = require('vcap_services');
var extend          = require('util')._extend;  
var qs              = require('qs');
var watson          = require('watson-developer-cloud');
var router          = express.Router();


console.log('>> Watson --> Rank and Retrieve Service ............... initiated');

var config = extend({
	url : 'https://gateway.watsonplatform.net/retrieve-and-rank/api',
	username : 'a8cb9ccd-dea1-4adf-a7c5-1345e3622c8c',
	password : '6P4Two8YHiHx',
        version: 'v1'
}, vcapServices.getCredentials('retrieve_and_rank'));

var credentials = extend(config, bluemix.getServiceCreds('retrieve_and_rank'));

var retrieve_and_rank = watson.retrieve_and_rank(credentials);


var params = {
  cluster_id: '',
  collection_name: '',
  wt: 'json'
};

retrieve_and_rank.listClusters({},
  function (err, response) {
    if (err)
      console.log('error:', err);
    else{
      console.log("********* CLUSTER NAMES : ***************");   
      console.log(JSON.stringify(response, null, 2));
      //var clusterInfo = JSON.stringify(response);
      //params.cluster_id = response.clusters[0].solr_cluster_id;
      console.log(params);
      console.log("*****************************************");   
  }
});



router.get('/talkRR', function(req, res) {
        var params = {
            cluster_id      : req.body.cluster_id,
            collection_name : req.body.collection_name,
            ranker_id       : req.body.ranker_id,
            query           : req.body.query
        };
        
        var solrClient = retrieve_and_rank.createSolrClient(params);
        var ranker_id = params.ranker_id;
        var question  = 'q='+params.query;
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
            }               
            res.json(watsonRanker);
            
            }
              else {
                //console.log(JSON.stringify(searchResponse.response.docs, null, 2));
                var watsonRanker = {
                    cluster_id      : data7.RRData.cluster_id,
                    collection_name : data7.RRData.RRData.params.classifier,
                    ranker_id       : data7.ranker_id,
                    err_msg         : '',
                    docs            : searchResponse.response.docs
               } 
                res.json(watsonRanker);
              }
        });               
        
        //res.json(result);
	
});


retrieve_and_rank.listRankers({},
  function(err, response) {
    if (err)
      console.log('error: ', err);
    else
      console.log(JSON.stringify(response, null, 2));
});




require('../config/error-handler')(app);
// export public functions
module.exports = { 
    router : router,
    retrieve_and_rank : retrieve_and_rank
}










