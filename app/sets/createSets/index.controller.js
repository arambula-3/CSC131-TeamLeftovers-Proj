var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('config.json');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db('mongodb://team:f505zQAq94T3TcZI@csc131-project-shard-00-00.mvprq.mongodb.net:27017,csc131-project-shard-00-01.mvprq.mongodb.net:27017,csc131-project-shard-00-02.mvprq.mongodb.net:27017/userDB?ssl=true&replicaSet=atlas-jpao4r-shard-0&authSource=admin&retryWrites=true&w=majority', { native_parser: true });
db.bind('sets');

var service = {};

service.create = create;

module.exports = service;

function create(userParam) {
  var deferred = Q.defer();

  // validation
  db.sets.findOne(
      { setname: userParam.setname },
      function (err, user) {
          if (err) deferred.reject(err);

          if (user) {
              // username already exists
              deferred.reject('The set name "' + userParam.setname + '" is already taken');
          } else {
              createSet();
          }
      });

  function createSet() {
      

      db.sets.insert(
          set,
          function (err, doc) {
              if (err) deferred.reject(err);

              deferred.resolve();
          });
  }

  return deferred.promise;
}
