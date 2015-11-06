var Router            = require('koa-router');
var version              = new Router();
var db                = require('../db');

module.exorts = version;

var LATEST_VERSION = {
  'DEBUG' : {
    name : '1.0',
    number : 1
  }
  'RELEASE' : {
    name : '1.0',
    number : 1
  },
}

version.get('/check', function*(){
  var body = this.query;
  body.version = parseInt(body.version);
  if(LATEST_VERSION[body.build]['number'] > body.version) {
    this.body = {update : true,message : 'A better app version is available. Please update to have a better expierience'}
  }
  else this.body = {update : false}
})
