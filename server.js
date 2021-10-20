// modules =================================================
const express = require('express');
const app = express();
var mongoose = require('mongoose');
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    User = require("./models/users");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


//set our port
const port = 3000;


// configuration ===================================

//config files
var db = require('./config/db');
console.log("connecting--", db);
mongoose.connect(db.url); //Mongoose connection created


// frontend routes =========================================================
app.get('/', function(req, res) {res.render('home')});

//login form
app.get("/login", function (req, res) {
    res.render("login");
});

//Handling user login
app.post("/login", passport.authenticate("local", {
    successRedirect: "/secret",
    failureRedirect: "/login"
}), function (req, res) {
});

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

