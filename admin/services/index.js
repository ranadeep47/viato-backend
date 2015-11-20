var db = require('../../db');
var Router = require('koa-router');
var services = new Router();
var fs = require('fs');
var _ = require('lodash');

var moment = require('moment');

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
  var Coupon = this.request.body;
  delete Coupon['mobile'];
  Coupon['expires_at'] = moment().add(Coupon['expires_at'], 'days')
  .hours(0)
  .minutes(0)
  .seconds(0)
  .milliseconds(0)
  .toDate();
  var ctx = this;

  yield db.User.findOne({mobile : mobile}).select('mobile').exec().then(function(User){
    return db.User.addCopoun(User['_id'], Coupon).then(function(){
      ctx.body = 'Added';
    })
  })
})
