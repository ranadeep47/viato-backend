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
  var page = this.query['page'] || 0;
  page = parseInt(page);
  if(isNaN(page)) page = 0;

  var limit = 12;
  var skip = page * limit;

  this.body = yield db.Feed
  .findOne({type : 'TRENDING'},{list : {$slice : [skip, limit]}})
  .exec();
})

feed.get('/category/:id', function*() {
  var page = this.query['page'] || 0;
  page = parseInt(page);
  if(isNaN(page)) page = 0;

  var limit = 12;
  var skip = page * limit;

  var categoryId = this.params['id'];
  this.body = yield db.Feed
  .findOne({_id : categoryId},{list : {$slice : [skip, limit]}})
  .exec();
})
