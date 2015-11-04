var Router            = require('koa-router');
var geo               = new Router();
var db                = require('../db');
var utils             = require('../utils');
var _                 = require('lodash');
var reverseGeocoding  = require('../services/reverseGeocoding');

geo.get('/supported/all', function*(){
  this.body = reverseGeocoding.getSupported;
})

geo.get('/supported/status', function*(){
  var ctx = this;
  var location = this.request.query;
  this.body = yield reverseGeocoding.isSupported(location);
})
