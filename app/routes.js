// app/routes.js

var express 	= require('express');
var router 		= express.Router();
var http 		= require('http');


router.get('/todos', function(req, res) {
	console.log(" >> /api/todos/ GET in \"routes.js\" aufgerufen");
	// use mongoose to get all todos in the database
	// getTodos(res);
	res.send('Our Sample API is up   sadasasd...');
});

router.get('/about', function(req, res) {
	res.sendfile('./public/partials/registration.html');
});

//router.post('/scoring/callEngine', function(req, res) {
//	console.log("Got response: " + res.statusCode + "   " + req.body.choosenClient.firstname+ " "+req.body.choosenClient.lastname);
//	var retData = req.body.choosenClient;
//	console.log("Return Data = "+retData.occupation);
//	if(retData != null){
//		res.json(retData);	
//	}
//	//res.sendfile('./public/pages/scoring/callDecisionService.html');	
//});

router.post('/scoring/callEngine', function(req, res) {
	console.log("Got response: " + res.statusCode + "   " + req.body.choosenClient.firstname+ " "+req.body.choosenClient.lastname);
	var retData = req.body.choosenClient;
	console.log("Return Data = "+retData.occupation);
	if(retData != null){
		//res.json(retData);	
		var data = JSON.stringify(retData);
		console.log(data);
		res.send(data);
	}
	//res.sendfile('./public/pages/scoring/callDecisionService.html');	
});



// application -------------------------------------------------------------
router.get('*', function(req, res) {
	res.sendfile('./public/index.html'); // load the single view file
	// (angular will handle the page
	// changes on the front-end)
});

module.exports = router;





/*
//Read all
app.get('/todos', function (req, res) {
  res.send(todos.all());
});

// Read
app.get('/todo/:id', function (req, res) {
  res.send(todos.withId(req.params.id));
});

// Create
app.post('/todo', function (req, res) {
  var todo = todos.create(req.body.data);
  res.send(201, todo);
});

// Update
app.put('/todo/:id', function (req, res) {
  var todo = todos.update(req.params.id, req.body.data);
  res.send(todo);
});

// Delete
app.del('/todo/:id', function (req, res) {
  todos.del(req.params.id);
  res.send(200);
});
*/
