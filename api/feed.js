var Router = require('koa-router');
var feed = new Router();
var db = require('../db');
var utils = require('../utils');
var _ = require('lodash');

module.exports = feed;

feed.get('/home', function*() {
  this.body = yield db.Feed.find().select('-list -__v').exec();
})

feed.get('/trending', function*() {
  //TODO : Have trending category ?
  var Id = '561e5ca78669ae5535cff4f3';
  this.body = yield db.Feed.findOne({_id : Id }).exec();
});

feed.get('/category/:id', function*() {
  var categoryId = this.params['id'];
  this.body = yield db.Feed.findOne({_id : categoryId}).exec();
})
