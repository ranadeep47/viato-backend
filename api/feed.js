var Router = require('koa-router');
var feed = new Router();
var db = require('../db');
var utils = require('../utils');
var _ = require('lodash');

module.exports = feed;

feed.get('/home', function*() {
  this.body = yield db.Feed.find({type : 'GENRES'})
  .select('-list -__v')
  .sort({'rating' : -1})
  .exec();
})

feed.get('/trending', function*(){
  this.body = yield db.Feed.findOne({type : 'TRENDING'}).exec();
})

feed.get('/category/:id', function*() {
  var categoryId = this.params['id'];
  this.body = yield db.Feed.findOne({_id : categoryId}).exec();
})
