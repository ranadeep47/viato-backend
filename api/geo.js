var Router            = require('koa-router');
var geo               = new Router();
var db                = require('../db');
var utils             = require('../utils');
var _                 = require('lodash');
var reverseGeocoding  = require('../services/reverseGeocoding');

module.exports = geo;

geo.get('/supported/all', function*(){
  this.body = reverseGeocoding.getSupported();
})

geo.get('/supported/status', function*(){
  var ctx = this;
  var location = this.request.query;
  this.body = yield reverseGeocoding.isSupported(location);
})

geo.get('/supported', function*(){
  console.log('Hahhaha');
  var placeId = this.query['placeId'];
  var address = {locality : {placeId : placeId}};
  console.log(address);
  this.body = yield reverseGeocoding.isAddressServed(address);
})
