var db = require('../../db');
var Router = require('koa-router');
var services = new Router();
var fs = require('fs');
var _ = require('lodash');

module.exports = services;

var sms     = require('../../services/sms');
var gcm     = require('../../services/gcm');
var copouns = require('../../services/copouns');

services.get('/', function*(){
  yield this.render('all-services');
})

services.get('sendSMS', function*(){
  yield this.render('send-sms');
})

services.post('sendSMS', function*(){
  var mobile = this.request.body['mobile'];
  var message = this.request.body['message'];
  var ctx = this;
  yield sms.sendMessage(mobile, message).then(function(){
    ctx.body = 'Sent';
  })
})

services.get('sendNotification', function*(){
  yield this.render('send-notification');
})

services.post('sendNotification', function*(){
  var mobile = this.request.body['mobile'];
  var message = this.request.body['message'];
  var title = this.request.body['title'];
  var ctx = this;
  yield gcm.sendNotification(mobile, title, message).then(function(){
    ctx.body = 'Sent';
  })
})

services.get('addCoupon', function*(){
  yield this.render('add-coupon');
})

services.post('addCoupon', function*(){
  var mobile = this.request.body['mobile'];
  var coupon = this.request.body['coupon'];

})
