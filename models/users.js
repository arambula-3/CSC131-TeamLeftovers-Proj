var mongoose = require('mongoose');

// define our user model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('User', {
  //firstName: {type : String, default: ''}, first name requirement no longer necessary
  //lastName: {type : String, default: ''}, last name requirment no longer necessary
  username : {type : String, default: ''},
  password : {type : String, default: ''},
  level : {type : String, default: ''}, //admin or user
  sets: {type: Array, default: ''}  // sets: [set1, set2, etc.]
});
