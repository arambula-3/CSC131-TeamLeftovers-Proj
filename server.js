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
//users can view their sets but not rotate their sets
app.use('/homepage', require('./controllers/homepage.controller'));
app.use('/login', require('./controllers/login.controller'));
app.use('/register', require('./controllers/register.controller'));
app.use('/app', require('./controllers/app.controller'));
app.use('/api/users', require('./controllers/users.controller'));
//To access images in public folder for html code
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

app.delete('/file/:filename', (req, res) => {
    gfs.find({filename: req.params.filename}).toArray(function (err, files) {
        if(files.length===0){
            return res.status(400).send({
                message: 'File not found'
            });
        }
        gfs.delete(files[0]._id);
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

app.post('/createSet', (req, res) => {
    console.log(req.body);
    let setData = [];
    setData = req.body;
    let setName = setData[setData.length - 2];
    let userName = setData[setData.length - 1];
    let db = mongo.db('mongodb://team:f505zQAq94T3TcZI@csc131-project-shard-00-00.mvprq.mongodb.net:27017,csc131-project-shard-00-01.mvprq.mongodb.net:27017,csc131-project-shard-00-02.mvprq.mongodb.net:27017/userDB?ssl=true&replicaSet=atlas-jpao4r-shard-0&authSource=admin&retryWrites=true&w=majority', { native_parser: true });
    db.bind('sets');
    db.sets.insert({name: setName, user: userName, imgs: setData.slice(0, -2)});
    db.bind('users');
    db.users.update({username: userName}, {$push: {sets: {$each: [setName]}}}, {safe: true});
})

app.delete('/set/:setname/:username', (req, res) => {
    let db = mongo.db('mongodb://team:f505zQAq94T3TcZI@csc131-project-shard-00-00.mvprq.mongodb.net:27017,csc131-project-shard-00-01.mvprq.mongodb.net:27017,csc131-project-shard-00-02.mvprq.mongodb.net:27017/userDB?ssl=true&replicaSet=atlas-jpao4r-shard-0&authSource=admin&retryWrites=true&w=majority', { native_parser: true });
    db.bind('sets');
    db.sets.deleteOne({name: req.params.setname});
    db.bind('users');
    db.users.update({username: ""+req.params.username}, {$pull: {sets: {$in : [""+req.params.setname]}}});
})

app.get('/set/:setname', (req, res) => {
    let db = mongo.db('mongodb://team:f505zQAq94T3TcZI@csc131-project-shard-00-00.mvprq.mongodb.net:27017,csc131-project-shard-00-01.mvprq.mongodb.net:27017,csc131-project-shard-00-02.mvprq.mongodb.net:27017/userDB?ssl=true&replicaSet=atlas-jpao4r-shard-0&authSource=admin&retryWrites=true&w=majority', { native_parser: true });
    db.bind('sets');
    db.sets.find({name: req.params.setname}, {imgs: 1, _id: 0}).toArray(function(error, documents) {
        res.json(documents[0].imgs);
    }); 
})

app.get('/set/:setname/view', (req, res) => {
    res.sendFile(__dirname + '/app/sets/viewSets/oneSetView.html');
})

app.get('/set/:setname/edit', (req, res) => {
    res.sendFile(__dirname + '/app/sets/editSets/oneSetEdit.html');
})

app.delete("/set/:setname/edit/:image", (req, res) => {
    let db = mongo.db('mongodb://team:f505zQAq94T3TcZI@csc131-project-shard-00-00.mvprq.mongodb.net:27017,csc131-project-shard-00-01.mvprq.mongodb.net:27017,csc131-project-shard-00-02.mvprq.mongodb.net:27017/userDB?ssl=true&replicaSet=atlas-jpao4r-shard-0&authSource=admin&retryWrites=true&w=majority', { native_parser: true });
    db.bind('sets');
    db.sets.update({name: ''+req.params.setname}, {$pull: {imgs: {$in : ["http://localhost:3000/file/" + req.params.image]}}});
})

app.post("/set/:setname/edit/:image", (req, res) => {
    let db = mongo.db('mongodb://team:f505zQAq94T3TcZI@csc131-project-shard-00-00.mvprq.mongodb.net:27017,csc131-project-shard-00-01.mvprq.mongodb.net:27017,csc131-project-shard-00-02.mvprq.mongodb.net:27017/userDB?ssl=true&replicaSet=atlas-jpao4r-shard-0&authSource=admin&retryWrites=true&w=majority', { native_parser: true });
    db.bind('sets');
    db.sets.update({name: ''+req.params.setname}, {$push: {imgs: {$each: ["http://localhost:3000/file/" + req.params.image]}}}, {safe: true});
})

var Set = require('./models/sets');
app.get('/sets', (req, res) => {
    Set.find(function(err, sets) {
        // if there is an error retrieving, send the error.
        // nothing after res.send(err) will execute
        let setsData = [];
        if (err) {
           res.send(err);
        }
        for (let i = 0; i < sets.length; i++) {
            //setsData.push(sets[i].name);
            //add username of set
            setsData.push({"setName": sets[i].name, "setUser": sets[i].user})
        }
        res.json(setsData); // return all set names
     });
  })

// startup our app at http://localhost:3000
app.listen(port);
console.log('Example app listening on port 3000!');
