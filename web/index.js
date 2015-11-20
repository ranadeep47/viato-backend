var Router = require('koa-router');
var web = new Router();
var db = require('../db');
var utils = require('../utils');
var _ = require('lodash');
var sms = require('../services/sms');

module.exports = web;

web.get('/sms', function*(){
  var mobile = this.query['mobile'];
  var message = 'Download Viato app and start renting now! : https://viato.in/app';
  var ctx = this;
  yield sms.sendMessage(mobile, message).then(function(){
    ctx.body = 'SMS Sent';
  })
})
