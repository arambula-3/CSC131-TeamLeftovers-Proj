// modules =================================================
require('rootpath')();
const express = require('express');
const app = express();
var mongoose = require('mongoose');
var session = require('express-session');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var config = require('config.json');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: config.secret, resave: false, saveUninitialized: true }));

// use JWT auth to secure the api
app.use('/api', expressJwt({ secret: config.secret, algorithms: ['HS256'] }).unless({ path: ['/api/users/authenticate', '/api/users/register'] }));


//set our port
const port = 3000;


// configuration ===================================

//config files
var db = require('./config/db');
console.log("connecting--", db);
mongoose.connect(db.url); //Mongoose connection created


// frontend routes =========================================================

// routes
app.use('/login', require('./controllers/login.controller'));
app.use('/register', require('./controllers/register.controller'));
app.use('/app', require('./controllers/app.controller'));
app.use('/api/users', require('./controllers/users.controller'));

// make '/app' default route
app.get('/', function (req, res) {
    return res.redirect('/app');
});

// startup our app at http://localhost:3000
app.listen(port);
console.log('Example app listening on port 3000!');
