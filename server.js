// server.js
// where your node app starts

const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const path = require('path')
const http = require("http");
const session = require('express-session');
const port = 8080;
const fs = require("fs");
const routes = require('./routes/index.js');
const partials = require('express-partials');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const { check, validationResult } = require('express-validator');
var LocalStrategy   = require('passport-local').Strategy;

app.use(express.static("views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
routes(app);
app.use(partials());

// init db
var mysql = require('mysql');
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "testdb"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  //var sql = "CREATE TABLE Pending (id INT AUTO_INCREMENT PRIMARY KEY, name TEXT, category TEXT, type TEXT, country TEXT, state TEXT, city TEXT, startDate TEXT, endDate TEXT, deadline TEXT, cost TEXT, currency TEXT, description TEXT, link TEXT, visibility BOOLEAN)";
  // con.query(sql, function (err, result) {
  //  if (err) throw err;
  //  console.log("1 record inserted");
  //});
});

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


var server = app.listen(8080, "127.0.0.1", function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

});

app.get("/getOpps", function (request, response) {
  con.query("SELECT * from Opportunities", function (err, rows, fields) {
    if (err) throw err;
    response.send(JSON.stringify(rows));
  });
});

app.get("/getPending", function (request, response) {
	con.query("SELECT * from Pending", function (err, rows, fields) {
		if (err) throw err;
		response.send(JSON.stringify(rows));
	});
});

app.post("/upload", (request, response) => {

  var createUpload = {
		name: request.body.name,
		category: request.body.category,
		type: request.body.type,
		country: request.body.country,
		state: request.body.state,
		city: request.body.city,
		startDate: request.body.startDate,
		endDate: request.body.endDate,
		deadline: request.body.deadline,
		cost: request.body.cost,
		currency: request.body.currency,
		description: request.body.description,
		link: request.body.link,
		visibility: 0,
	}
  con.query('INSERT INTO Pending SET ?', createUpload, function (err, resp) {
		if (err) throw err;
    // if there are no errors send an OK message.
    response.render('pages/upload');
  });
});

app.post("/deletePending/:id", (request, response) => {

	var user = { id: request.params.id }

	//if (req.session.loggedin) {
  con.query('DELETE FROM Pending WHERE ?', user, function (err, resp) {
		if (err) {
      //request.flash('error', err)
      // redirect to users list page
      response.redirect('/admin')
  	}
		else {
      //request.flash('success', 'User deleted successfully! id = ' + request.params.id)
      // redirect to users list page
      response.redirect('/admin')
		}
	})
  //} else {
	//  return res.send('Please login to view this page!');
	//}
});


function userIsAllowed(callback, status) {
  // this function would contain your logic, presumably asynchronous,
  // about whether or not the user is allowed to see files in the
  // protected directory
  console.log(status);
  callback(status);
};

// This function returns a middleware function
var protectPath = function(regex) {
  return function(req, res, next) {
    if (!regex.test(req.url)) { return next(); }

    userIsAllowed(function(allowed) {
      if (allowed) {
        next(); // send the request to the next handler, which is express.static
      } else {
        res.end('You are not allowed!');
      }
    });
  };
};

app.use(protectPath(/pages\/protected\/.*$/));

 app.post('/auth', [
   check('username').trim().escape(),
   check('password').trim().escape()
 ], function(request, response) {
 	var username = request.body.username;
	var password = request.body.password;
 	if (username && password) {
 		con.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
 			if (results.length > 0) {
 				request.session.loggedin = true;
 				request.session.username = username;
 				response.redirect('/admin');
 			} else {
 				response.send('Incorrect Username and/or Password!');
 			}
 			response.end();
 		});
 	} else {
 		response.send('Please enter Username and Password!');
 		response.end();
 	}
 });
