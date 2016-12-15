// app/routes.js

var express 	= require('express');
var router 	= express.Router();

var cloudant;
var dbs = {
    jdmessages: 'johndeeredb'
}

console.log('>> DB: Cloudant --> Database ............... initiated');

var createIssueDocument = function (myIssues) {
  console.log("Creating document: " + myIssues.anlagename);
  // we are specifying the id of the document so we can update and delete it later
  dbs.jdMessagesDB.insert(myIssues, function(err, data) {
    //console.log("Data:", data);
    return data;
  });
};

// update a document
var updateIssueStatus = function(issue,callback) {
  console.log("Updating document 'mydoc'");
  // make a change to the document, using the copy we kept from reading it back
  issue.status = 'close';
  dbs.jdMessagesDB.insert(issue, function(err, data) {
    console.log("Error:", err);
    console.log("Data:", data);
    // keep the revision of the update so we can delete it
    doc._rev = data.rev;
    callback(err, data);
  });
};

var readIssue = function(_id) {
  console.log("Reading document 'mydoc'");
  dbs.jdMessagesDB.get(_id, function(err, data) {
    console.log("Data:", data);
    // keep a copy of the doc so we know its revision token
    return data;
  });
};





function initDBConnection() {

    if (process.env.VCAP_SERVICES) {
        var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
        if (vcapServices.cloudantNoSQLDB) {
            dbs.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
            dbs.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
            dbs.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
            dbs.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
            dbs.url = vcapServices.cloudantNoSQLDB[0].credentials.url;
        }
        //console.log('VCAP Services: ' + JSON.stringify(process.env.VCAP_SERVICES));
    } else {

        console.log("Can not access global bluemix variables. Properties are set LOCALLY");

        dbs.host = "98cd6d99-d1b6-41be-851b-f322381d73e7-bluemix.cloudant.com";
        dbs.port = 443;
        dbs.user = "98cd6d99-d1b6-41be-851b-f322381d73e7-bluemix";
        dbs.password = "f71a1b522903a2cef9bcdabb8afc9ef7870a9eb32e03062bf671992e1cb5406a";
        dbs.url = "https://98cd6d99-d1b6-41be-851b-f322381d73e7-bluemix:f71a1b522903a2cef9bcdabb8afc9ef7870a9eb32e03062bf671992e1cb5406a@98cd6d99-d1b6-41be-851b-f322381d73e7-bluemix.cloudant.com";

         console.log('============================ DB Properties =====================================');
         console.log('  lokal defined:   '+dbs.url);
         console.log('================================================================================');
        //return;
    }

    cloudant = require('cloudant')(dbs.url);

    //check if DB exists if not create
    cloudant.db.create(dbs.jdmessages, function (err, res) {
        if (err) {
            console.log('>> DB: Could not create db for JD - How it looks DB is already exists ');
        }
    });

    dbs.jdMessagesDB = cloudant.use(dbs.jdmessages);
   // dbs.jdMessagesDB.index( {name:'dateindex', type:'json', index:{fields:['date']}});
   // dbs.jdMessagesDB.index( {name:'statusindex', type:'json', index:{fields:['status']}});
}



router.get('/issues', function(request, response) {
    console.log("somebody wiped over the Samrtphone !!!!");
 dbs.jdMessagesDB.list({
            include_docs: true
        }, function (err, body) {
  if (!err) {
    var issues = [];
    
    body.rows.forEach(function(doc) {
         var issue = {};
         issue.processed = doc.doc.processed;
         issue.id = doc.doc._id;
         issue.problemart = doc.doc.problemart;
         issue.arbeitsstation = doc.doc.arbeitsstation;
         issue.status = doc.doc.status;
         issue.inventurnummer = doc.doc.inventurnummer;
         issue.anlagename = doc.doc.anlagename;
         issue.kostenstelle = doc.doc.kostenstelle;
         issue.stoerungsbeschreibung = doc.doc.stoerungsbeschreibung;
         issue.date = doc.doc.date;
        if(issue.status == 'open'){  
            issues.push(issue);
        }
      });     
      //console.log(JSON.stringify(issues));
      response.setHeader('Content-Type','application/json');
      response.send(JSON.stringify(issues));
    }
  });
});


initDBConnection();
module.exports = { 
    router : router,
    dbs : dbs,
    updateIssueStatus : updateIssueStatus,
    readIssue : readIssue, 
    createIssueDocument : createIssueDocument
}

