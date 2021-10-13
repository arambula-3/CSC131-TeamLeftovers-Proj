// modules =================================================
const express = require('express');
const app = express();
var mongoose = require('mongoose');

// set our port
const port = 3000;

// configuration ===========================================

// config files
var db = require('./config/db');
console.log("connecting--",db);
mongoose.connect(db.url); //Mongoose connection created

// frontend routes =========================================================
app.get('/', function(req, res) {res.send('Hello World this is our App!')});

// defining route
app.get('/tproute', function (req, res) {
   res.send('This is routing for the application developed using Node and Express...');
});

// sample api route
// grab the user model we just created
var User = require('./models/users');
app.get('/api/users', function(req, res) {
   // use mongoose to get all users in the database
   User.find(function(err, users) {
      // if there is an error retrieving, send the error.
      // nothing after res.send(err) will execute
      if (err)
         res.send(err);
      res.json(users); // return all students in JSON format
   });
});

// startup our app at http://localhost:3000
app.listen(port);
console.log('Example app listening on port 3000!');
