var Router            = require('koa-router');
var version              = new Router();
var db                = require('../db');

module.exorts = version;

//TODO
var LATEST_VERSION = config.versioning;

version.get('/check', function*(){
  var body = this.query;
  body.version = parseInt(body.version);
  if(LATEST_VERSION[body.build]['number'] > body.version) {
    this.body = {update : true,message : 'A better app version is available. Please update to have a better expierience'}
  }
  else this.body = {update : false}
})
