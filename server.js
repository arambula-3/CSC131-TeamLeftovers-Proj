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
app.use('/homepage', require('./controllers/homepage.controller'));
app.use('/login', require('./controllers/login.controller'));
app.use('/register', require('./controllers/register.controller'));
app.use('/app', require('./controllers/app.controller'));
app.use('/api/users', require('./controllers/users.controller'));
app.use(express.static("public"));
/// new route
const uploadController = require("./app/imageDB/upload.controller");

// make '/app' default route
app.get('/', function (req, res) {
    return res.redirect('/app');
});

app.post("/upload", uploadController.uploadFile);

var mongo = require('mongoskin');
let gfs = new mongoose.mongo.GridFSBucket(mongo.db('mongodb://team:f505zQAq94T3TcZI@csc131-project-shard-00-00.mvprq.mongodb.net:27017,csc131-project-shard-00-01.mvprq.mongodb.net:27017,csc131-project-shard-00-02.mvprq.mongodb.net:27017/userDB?ssl=true&replicaSet=atlas-jpao4r-shard-0&authSource=admin&retryWrites=true&w=majority', { native_parser: true }), {bucketName: 'images'});
// Route for getting all the files
app.get('/file/:filename', (req, res) => {

  gfs.find({filename: req.params.filename}).toArray(function (err, files) {
    if(files.length===0){
        return res.status(400).send({
            message: 'File not found'
        });
    }

    res.writeHead(200, {'Content-Type': files[0].contentType});

    var readstream = gfs.openDownloadStreamByName(files[0].filename);

    readstream.on('data', function(chunk) {
        res.write(chunk);
    });

    readstream.on('end', function() {
        res.end();        
    });

    readstream.on('error', function (err) {
      console.log('An error occurred!', err);
      throw err;
    });
  });
});

app.get('/files', (req, res) => {
  let filesData = [];
  let count = 0;
  gfs.find({}).toArray((err, files) => {
      // Error checking
      if(!files || files.length === 0){
          return res.status(404).json({
              responseCode: 1,
              responseMessage: "error"
          });
      }
      // Loop through all the files and fetch the necessary information
      files.forEach((file) => {
          filesData[count++] = {
              filename: file.filename,
              url: "http://localhost:3000/file/" + file.filename,
              contentType: file.contentType
          }
      });
      res.json(filesData);
  });

});

// startup our app at http://localhost:3000
app.listen(port);
console.log('Example app listening on port 3000!');
