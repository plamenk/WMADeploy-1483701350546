/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

var red = require('node-red');
// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var path = require("path");
var when = require("when");
// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
//var needle = require('needle');

console.log('>> Watson --> QR Code Generator Service');

var bodyParser = require('body-parser');
var methodOverride = require('method-override');



// create a new express server
var app = express();
var appEnv = cfenv.getAppEnv();

console.log(appEnv);

//local Test
//if (JSON.parse(process.env.VCAP_APPLICATION) == undefined ) {

if (process.env.VCAP_APPLICATION && process.env.VCAP_SERVICES) {

var VCAP_APPLICATION = JSON.parse(process.env.VCAP_APPLICATION);
var VCAP_SERVICES = JSON.parse(process.env.VCAP_SERVICES);
//}
}

//node red

var settings = {
    uiPort: process.env.PORT || 1880,
    mqttReconnectTime: 15000,
    serialReconnectTime: 15000,
    debugMaxLength: 1000,

    // Add the bluemix-specific nodes in
    nodesDir: path.join(__dirname,"nodes"),

    // Blacklist the non-bluemix friendly nodes
    nodesExcludes:['66-mongodb.js','75-exec.js','35-arduino.js','36-rpi-gpio.js','25-serial.js','28-tail.js','50-file.js','31-tcpin.js','32-udp.js','23-watch.js'],

    // Enable module reinstalls on start-up; this ensures modules installed
    // post-deploy are restored after a restage
    autoInstallModules: true,

    // Move the admin UI
    httpAdminRoot: '/red',
  //  httpNodeRoot: "/api",
    uiPort: 1881,

    functionGlobalContext: {process: process},

    //storageModule: require("./couchstorage")
}
// You can set adminAuth yourself in this file, but it will look for the
// the following environment variables and automatically enable adminAuth
// if they have been set. That means you don't have to hardcode any
// credentials in this file.
if (process.env.NODE_RED_USERNAME && process.env.NODE_RED_PASSWORD) {
    settings.adminAuth = {
        type: "credentials",
        users: function(username) {
            if (process.env.NODE_RED_USERNAME == username) {
                return when.resolve({username:username,permissions:"*"});
            } else {
                return when.resolve(null);
            }
        },
        authenticate: function(username, password) {
            if (process.env.NODE_RED_USERNAME == username &&
                process.env.NODE_RED_PASSWORD == password) {
                return when.resolve({username:username,permissions:"*"});
            } else {
                return when.resolve(null);
            }
        }
    }
}
//test local
if (settings.couchAppname){

settings.couchAppname = VCAP_APPLICATION['application_name'];

// NODE_RED_STORAGE_NAME is automatically set by this applications manifest.
var storageServiceName = process.env.NODE_RED_STORAGE_NAME || new RegExp("^"+settings.couchAppname+".cloudantNoSQLDB");

var couchService = appEnv.getService(storageServiceName);

if (!couchService) {
    console.log("Failed to find Cloudant service");
    if (process.env.NODE_RED_STORAGE_NAME) {
        console.log(" - using NODE_RED_STORAGE_NAME environment variable: "+process.env.NODE_RED_STORAGE_NAME);
    }
    throw new Error("No cloudant service found");
}    
settings.couchUrl = couchService.credentials.url;

console.log(process.env.NODE_RED_USERNAME+"----ggggg");

}





/*standard 
// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
var server = app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
*/

//kai
// configuration ===========================================
var port = process.env.PORT || 8080; // set our port
// get all data/stuff of the body (POST) parameters
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));
app.use(bodyParser.json({ limit: '20mb' }));
app.use(methodOverride('X-HTTP-Method-Override')); // override with the
app.use(express.static(__dirname + '/public')); // set the static files location
  if (process.env.SECURE_EXPRESS)
    require('../config/security')(app);
// Setup the upload mechanism

app.all('/*', function(req, res, next) {
	// CORS headers
	res.header("Access-Control-Allow-Origin", "*"); // restrict it to the
	// required domain
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
	// Set custom headers for CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
	res.header('Access-Control-Allow-Headers',
			'Content-type,Accept,X-Access-Token,X-Key');
	if (req.method == 'OPTIONS') {
		res.status(200).end();
	} else {
		next();
	}
});

var AMACredentials = require('./app/AMAcredentials.js');
var watsonServices = require('./app/watsonServices');
var cloudantDBService = require('./app/cloudantdb');
var router = require('./app/routes');
var mqttClient3 = require('./app/mqttClient.js');
var visuRecogService = require('./app/visuRecognitionService.js');
var rankAndRetrieveService = require('./app/rankAndRetrieve.js');
var qrCodeGenService = require('./app/qrCodeGenerator.js');

app.use('/credent',AMACredentials.router);
app.use('/db',cloudantDBService.router);
app.use('/api', router);
app.use('/watson', watsonServices);
app.use('/service', qrCodeGenService);


//AMACredentials.allServicesAndCred();
// start app ===============================================
var server = app.listen(port);
//http.listen(port);

console.log(">> SERVER running at => http://localhost:" + port);

// expose app
exports = module.exports = app; 



/*standard 
// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
var server = app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
*/

red.init(server, settings);
app.use(settings.httpAdminRoot,red.httpAdmin);

red.start();