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

// delete user and all data
app.delete('/account/:username', (req, res) => {
    let db = mongo.db('mongodb://team:f505zQAq94T3TcZI@csc131-project-shard-00-00.mvprq.mongodb.net:27017,csc131-project-shard-00-01.mvprq.mongodb.net:27017,csc131-project-shard-00-02.mvprq.mongodb.net:27017/userDB?ssl=true&replicaSet=atlas-jpao4r-shard-0&authSource=admin&retryWrites=true&w=majority', { native_parser: true });
    db.bind('sets');
    db.sets.deleteMany({user: req.params.username});
    db.bind('users');
    db.users.deleteOne({username: req.params.username});
})

// createSet
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

// Delete sets from user and from set database
app.delete('/set/:setname/:username', (req, res) => {
    let db = mongo.db('mongodb://team:f505zQAq94T3TcZI@csc131-project-shard-00-00.mvprq.mongodb.net:27017,csc131-project-shard-00-01.mvprq.mongodb.net:27017,csc131-project-shard-00-02.mvprq.mongodb.net:27017/userDB?ssl=true&replicaSet=atlas-jpao4r-shard-0&authSource=admin&retryWrites=true&w=majority', { native_parser: true });
    db.bind('sets');
    ///added user argument
    db.sets.deleteOne({name: req.params.setname, user: req.params.username});
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

//Edit image from existing sets in the database
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

  var User = require('./models/users');
  app.get('/users', (req, res) => {
    User.find(function(err, users) {
        let userData = [];
        if (err) {
            res.send(err);
        }
        for (let i = 0; i < users.length; i++) {
            userData.push(users[i].username)
        }
        res.json(userData);
    });
  })

  app.get('/imagenames', (req, res) => {
    let imageNameArray = [];
    imageNameArray.push("Airplane");
    imageNameArray.push("Ankle");
    imageNameArray.push("Apples");
    imageNameArray.push("Arm");
    imageNameArray.push("Baby");
    imageNameArray.push("Bagels");
    imageNameArray.push("Backpack");
    imageNameArray.push("Balloons");
    imageNameArray.push("Balls");
    imageNameArray.push("Bananas");
    imageNameArray.push("Bandaid");
    imageNameArray.push("Barn");
    imageNameArray.push("Bathtub-Tub");
    imageNameArray.push("Battery");
    imageNameArray.push("Bead");
    imageNameArray.push("Bean");
    imageNameArray.push("Bear");
    imageNameArray.push("Bed");
    imageNameArray.push("Bell");
    imageNameArray.push("Belt");
    imageNameArray.push("Big Bird");
    imageNameArray.push("Bike");
    imageNameArray.push("Bird");
    imageNameArray.push("Blanket");
    imageNameArray.push("Blocks");
    imageNameArray.push("Boat");
    imageNameArray.push("Books");
    imageNameArray.push("Boots");
    imageNameArray.push("Bottle");
    imageNameArray.push("Bowl");
    imageNameArray.push("Bracelet");
    imageNameArray.push("Bread");
    imageNameArray.push("Bridge");
    imageNameArray.push("Broken");
    imageNameArray.push("Broom");
    imageNameArray.push("Brush");
    imageNameArray.push("Bubbles");
    imageNameArray.push("Bucket");
    imageNameArray.push("Bug");
    imageNameArray.push("Bus/School bus");
    imageNameArray.push("Butter");
    imageNameArray.push("Button");
    imageNameArray.push("Cake");
    imageNameArray.push("Camera");
    imageNameArray.push("Candle");
    imageNameArray.push("Candy");
    imageNameArray.push("Car");
    imageNameArray.push("Carrots");
    imageNameArray.push("Cat");
    imageNameArray.push("Cereal");
    imageNameArray.push("Chair");
    imageNameArray.push("Cheese");
    imageNameArray.push("Chicken");
    imageNameArray.push("Chips");
    imageNameArray.push("Clock");
    imageNameArray.push("Clown");
    imageNameArray.push("Coat");
    imageNameArray.push("Coloring Book");
    imageNameArray.push("Comb");
    imageNameArray.push("Computer");
    imageNameArray.push("Cookie Monster");
    imageNameArray.push("Cookies");
    imageNameArray.push("Cow");
    imageNameArray.push("Crackers");
    imageNameArray.push("Crayons");
    imageNameArray.push("Cup");
    imageNameArray.push("Diapers");
    imageNameArray.push("Dog");
    imageNameArray.push("Dolls");
    imageNameArray.push("Donald Duck");
    imageNameArray.push("Door");
    imageNameArray.push("Dress");
    imageNameArray.push("Drum");
    imageNameArray.push("Duck");
    imageNameArray.push("Ear");
    imageNameArray.push("Eggs");
    imageNameArray.push("Elbow");
    imageNameArray.push("Elephant");
    imageNameArray.push("Elmo");
    imageNameArray.push("Ernie");
    imageNameArray.push("Eyes");
    imageNameArray.push("Feet");
    imageNameArray.push("Fingers");
    imageNameArray.push("Fire");
    imageNameArray.push("Fish");
    imageNameArray.push("Flower");
    imageNameArray.push("Fork");
    imageNameArray.push("Fries");
    imageNameArray.push("Frog");
    imageNameArray.push("Garbage Can");
    imageNameArray.push("Giraffe");
    imageNameArray.push("(Eye)Glasses");
    imageNameArray.push("Glove");
    imageNameArray.push("Glue");
    imageNameArray.push("Grapes");
    imageNameArray.push("Grass");
    imageNameArray.push("Grover");
    imageNameArray.push("Hair");
    imageNameArray.push("Hamburger");
    imageNameArray.push("Hammer");
    imageNameArray.push("Hands");
    imageNameArray.push("Hat");
    imageNameArray.push("Head");
    imageNameArray.push("Helicopter");
    imageNameArray.push("Hips");
    imageNameArray.push("Horn");
    imageNameArray.push("Horse");
    imageNameArray.push("Hot Dog");
    imageNameArray.push("House");
    imageNameArray.push("Ice Cream");
    imageNameArray.push("Iron");
    imageNameArray.push("Jacket");
    imageNameArray.push("Juice");
    imageNameArray.push("Jump rope");
    imageNameArray.push("Keys");
    imageNameArray.push("Knee");
    imageNameArray.push("Knife");
    imageNameArray.push("Ladder");
    imageNameArray.push("Lamp-Light");
    imageNameArray.push("Leaf");
    imageNameArray.push("Leg");
    imageNameArray.push("Lion");
    imageNameArray.push("Lunch");
    imageNameArray.push("Magazine");
    imageNameArray.push("Mailbox");
    imageNameArray.push("Meat-Steak-Beef");
    imageNameArray.push("Mickey Mouse");
    imageNameArray.push("Mirror");
    imageNameArray.push("Money");
    imageNameArray.push("Monkey");
    imageNameArray.push("Moon");
    imageNameArray.push("Mouse");
    imageNameArray.push("Mouth");
    imageNameArray.push("Movie");
    imageNameArray.push("Music");
    imageNameArray.push("Napkin");
    imageNameArray.push("Nose");
    imageNameArray.push("Open");
    imageNameArray.push("Oranges");
    imageNameArray.push("Oscar");
    imageNameArray.push("Paints");
    imageNameArray.push("Pajamas");
    imageNameArray.push("Panties");
    imageNameArray.push("Pants");
    imageNameArray.push("Paper");
    imageNameArray.push("Paper Towels");
    imageNameArray.push("Pear");
    imageNameArray.push("Peas");
    imageNameArray.push("Pencil");
    imageNameArray.push("Phone");
    imageNameArray.push("Pie");
    imageNameArray.push("Pig");
    imageNameArray.push("Pillow");
    imageNameArray.push("Pizza");
    imageNameArray.push("Plate-Dish");
    imageNameArray.push("Play dough");
    imageNameArray.push("Pool");
    imageNameArray.push("Popcorn");
    imageNameArray.push("Pot-Pan");
    imageNameArray.push("Potatoes");
    imageNameArray.push("Pudding");
    imageNameArray.push("Puppets");
    imageNameArray.push("Purse");
    imageNameArray.push("Puzzles");
    imageNameArray.push("Rabbit");
    imageNameArray.push("Radio-Music");
    imageNameArray.push("Rain");
    imageNameArray.push("Rainbow");
    imageNameArray.push("Raisins");
    imageNameArray.push("Refrigerator");
    imageNameArray.push("Rice");
    imageNameArray.push("Ring");
    imageNameArray.push("Rock");
    imageNameArray.push("Sand");
    imageNameArray.push("Sandwich");
    imageNameArray.push("Scissors");
    imageNameArray.push("Sheep");
    imageNameArray.push("Shirt");
    imageNameArray.push("Shoes");
    imageNameArray.push("Shorts");
    imageNameArray.push("Shoulders");
    imageNameArray.push("Shovel");
    imageNameArray.push("Sink");
    imageNameArray.push("Slide");
    imageNameArray.push("Slinky");
    imageNameArray.push("Soap");
    imageNameArray.push("Socks");
    imageNameArray.push("Soda");
    imageNameArray.push("Sofa-Couch");
    imageNameArray.push("Soup");
    imageNameArray.push("Spaghetti");
    imageNameArray.push("Spoon");
    imageNameArray.push("Squirrel");
    imageNameArray.push("Stars");
    imageNameArray.push("Stereo");
    imageNameArray.push("Stove");
    imageNameArray.push("Strawberries");
    imageNameArray.push("Stamps");
    imageNameArray.push("Stool");
    imageNameArray.push("Straw");
    imageNameArray.push("Sun");
    imageNameArray.push("Sweater");
    imageNameArray.push("Swing");
    imageNameArray.push("Table");
    imageNameArray.push("Tape");
    imageNameArray.push("Teddy Bear");
    imageNameArray.push("Teeth");
    imageNameArray.push("Tiger");
    imageNameArray.push("Tigger");
    imageNameArray.push("Toes");
    imageNameArray.push("Toilet Paper");
    imageNameArray.push("Toilet/Potty");
    imageNameArray.push("Tomatoes");
    imageNameArray.push("Toothbrush");
    imageNameArray.push("Top (toy)");
    imageNameArray.push("Towels");
    imageNameArray.push("Train");
    imageNameArray.push("Tree");
    imageNameArray.push("Truck");
    imageNameArray.push("Tummy");
    imageNameArray.push("Turtle");
    imageNameArray.push("TV");
    imageNameArray.push("Umbrella");
    imageNameArray.push("Underpants");
    imageNameArray.push("Up");
    imageNameArray.push("Vacuum");
    imageNameArray.push("Video Tape");
    imageNameArray.push("Waffle");
    imageNameArray.push("Wagon");
    imageNameArray.push("Washcloth");
    imageNameArray.push("Watch");
    imageNameArray.push("Water");
    imageNameArray.push("Wheel");
    imageNameArray.push("Window");
    imageNameArray.push("Winnie/Pooh");
    imageNameArray.push("Yogurt");
    imageNameArray.push("Yo-yo");
    imageNameArray.push("Zipper");
    imageNameArray.push("Miscellaneous");
    res.json(imageNameArray);
  })

// startup our app at http://localhost:3000
app.listen(port);
console.log('Example app listening on port 3000!');
