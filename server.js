// modules =================================================
const express = require('express');
const app = express();
// set our port
const port = 3000;
app.get('/', function(req, res) {res.send('Hello World this is our App!')});

// startup our app at http://localhost:3000
app.listen(port);
console.log('Example app listening on port 3000!');
