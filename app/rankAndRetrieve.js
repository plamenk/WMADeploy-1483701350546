// app/rankAndRetrieve.js

//Module dependencies

var express         = require('express');
var Q	         	= require('q');
var app             = express();
var bluemix         = require('../config/bluemix');
var vcapServices    = require('vcap_services');
var extend          = require('util')._extend;
var qs              = require('qs');
var watson          = require('watson-developer-cloud');
var router          = express.Router();
var utils			= require("./utils.js");


console.log('>> Watson --> Rank and Retrieve Service ............... initiated');

var config = extend({
	url : 'https://gateway.watsonplatform.net/retrieve-and-rank/api',
	username : 'a8cb9ccd-dea1-4adf-a7c5-1345e3622c8c',
	password : '6P4Two8YHiHx',
        version: 'v1'
}, vcapServices.getCredentials('retrieve_and_rank'));

var credentials = extend(config, bluemix.getServiceCreds('retrieve_and_rank'));
console.log("[-][-]Use Cred: " + JSON.stringify(credentials));
var retrieve_and_rank = watson.retrieve_and_rank(credentials);


var params = {
  cluster_id: '',
  collection_name: '',
  wt: 'json'
};

function getClusterIdForName(name, callback) {
	var clusterId = "";
	var def = Q.defer();
	retrieve_and_rank.listClusters({}, function (err, response) {
		if (err) {
			utils.logging("error in getClusterIdForName: \n" + JSON.stringify(err));
			def.reject(err, response);
		}
		else{
			utils.logging("clusters:\n" + JSON.stringify(response));
			if (utils.isNotEmpty(name)) {
				for (var i = 0; i < response.clusters.length; i++) {
					if (name.toLowerCase() == response.clusters[i].cluster_name.toLowerCase()) {
						clusterId = response.clusters[i].solr_cluster_id;
					}
				}
			}
			else {
				if (utils.isNotEmpty(response.clusters) && (response.clusters.length > 0)) {
					clusterId = response.clusters[0].solr_cluster_id;
				}
			}
			utils.logging("clusterId: " + JSON.stringify(clusterId));
			def.resolve(clusterId);
		}
	});
	return def.promise.nodeify(callback);
}

function getRankerIdAndCollectionForName(name, callback) {
	var rankerCollection = {
		ranker_id		: "",
		collection_name	: ""
	};
	var def = Q.defer();
	retrieve_and_rank.listRankers({}, function (err, response) {
		if (err) {
			utils.logging("error in getClusterIdForName: \n" + JSON.stringify(err));
			def.reject(err, response);
		}
		else{
			utils.logging("rankers:\n" + JSON.stringify(response));
			if (utils.isNotEmpty(name)) {
				for (var i = 0; i < response.rankers.length; i++) {
					if (name.toLowerCase() == response.rankers[i].name.toLowerCase()) {
						rankerCollection.ranker_id = response.rankers[i].ranker_id;
						rankerCollection.collection_name = response.rankers[i].name;
					}
				}
			}
			else {
				if (utils.isNotEmpty(response.rankers) && (response.rankers.length > 0)) {
						rankerCollection.ranker_id = response.rankers[0].ranker_id;
						rankerCollection.collection_name = response.rankers[0].name;
				}
			}
			utils.logging("rankerCollection: " + JSON.stringify(rankerCollection));
			def.resolve(rankerCollection);
		}
	});
	return def.promise.nodeify(callback);
}


//return ranked results
function searchAndRank(question, responseRecord, callback) {
	
	var def = Q.defer();
	var cluster_id = responseRecord.cluster_id;
	var collection_name = responseRecord.collection_name;
	var ranker_id = responseRecord.ranker_id;

	var params = {
		cluster_id      : cluster_id,
		collection_name : collection_name,
		wt              : "json"
	};
	
	var solrClient = retrieve_and_rank.createSolrClient(params);
	var query     = qs.stringify({q: question, ranker_id: ranker_id, fl: "id,title,body"});
	solrClient.get("fcselect", query, function(err, searchResponse) {
		utils.logging("Output from Select & Rank:\n" + JSON.stringify(searchResponse));
		if (err) {
			utils.logging("error in searchAndRank:\n" + JSON.stringify(err));
			def.reject(err, searchResponse);
		}
		else {
			if (searchResponse.response.docs.length > 0) {
				searchResponse.response.response = ["Please check the following. " + searchResponse.response.docs[0].title]; 
				searchResponse.response.confidence = 0.5;
			}
			// Plamen: fix to remove body and title arrays in order to work with the front-end app
			for (var i = 0; i < searchResponse.response.docs.length; i++) {
				searchResponse.response.docs[i] = {
					id		: searchResponse.response.docs[i].id,
					title	: searchResponse.response.docs[i].title[0],
					body	: searchResponse.response.docs[i].body[0]
				};
			}
			def.resolve(searchResponse.response	);
		}
	});
	return def.promise.nodeify(callback);
}

//return normal search results
function search(question, responseRecord, callback) {
	
	var def = Q.defer();
	var cluster_id = responseRecord.cluster_id;
	var collection_name = responseRecord.collection_name;

	var params = {
		cluster_id      : cluster_id,
		collection_name : collection_name,
		wt              : "json"
	};
	
	var solrClient = retrieve_and_rank.createSolrClient(params);
	var query     = qs.stringify({q: question, fl: "id,title,body"});
	solrClient.get("select", query, function(err, searchResponse) {
		//utils.logging("Output from Select:\n" + JSON.stringify(searchResponse));
		if (err) {
			utils.logging("error in searchAndRank:\n" + JSON.stringify(err));
			def.reject(err, searchResponse);
		}
		else {
			if (searchResponse.response.docs.length > 0) {
				searchResponse.response.response = ["Please check the following. " + searchResponse.response.docs[0].title]; 
				searchResponse.response.confidence = 0.49;
			}
			// Plamen: fix to remove body and title arrays in order to work with the front-end app
			for (var i = 0; i < searchResponse.response.docs.length; i++) {
				searchResponse.response.docs[i] = {
					id		: searchResponse.response.docs[i].id,
					title	: searchResponse.response.docs[i].title[0],
					body	: searchResponse.response.docs[i].body[0]
				};
			}
			def.resolve(searchResponse.response);
		}
	});
	return def.promise.nodeify(callback);
}




require('../config/error-handler')(app);
// export public functions
module.exports = {
    router 							: router,
	retrieve_and_rank				: retrieve_and_rank,
    getClusterIdForName 			: getClusterIdForName,
	getRankerIdAndCollectionForName	: getRankerIdAndCollectionForName,
	searchAndRank					: searchAndRank,
	search							: search	
}
