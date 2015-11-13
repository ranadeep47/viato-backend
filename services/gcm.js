var gcm     = require('node-gcm');
var sender  = new gcm.Sender(config['gcm-sender-id']);
var db      = require('../db');
var _       = require('lodash');

var defaults = {
      priority : 'high',
      restrictedPackageName: "in.viato.app",
      data : {

      },

      notification : {
        icon  : "ic_launcher",
        sound : "default"
      }
}

//
exports.notifyOrder     = notifyOrder;
exports.notifyExpirey   = notifyExpirey;
exports.notifyNewBooks  = notifyNewBooks;

function notifyOrder(userId,status,body,bookingId){
  return getTokens(userId).then(function(tokens){
    var message = _.extend({}, defaults);

    switch(status) {
      case 'PLACED' :
        message.notification.title = 'Order placed';
        message.notification.body = 'We receieved your order and we are processing it.';
        message.notification.click_action = 'in.viato.app.BOOKING';

        break;
      case 'CANCELLED' :
        message.notification.title = 'Order cancellations';
        message.notification.body = 'Sorry, due to unavilability we cancelled your request for '+body.item.title;
        message.notification.click_action = 'in.viato.app.BOOKING';
        break;
      case 'CONFIRMED' :
        message.notification.title = 'Order confirmed';
        message.notification.body = 'Your request for '+body.item.title + ' has been confirmed and will be at your doorstop in less than 2 days';
        message.notification.click_action = 'in.viato.app.BOOKING';
        break;
      case 'DISPATCHED' :
        message.notification.title = 'Order dispatched';
        message.notification.body = 'Your order has been disptached and you will receive it in a few hours';
        message.notification.click_action = 'in.viato.app.BOOKING';
        break;
      case 'DELIVERED' :
        message.notification.title = 'Order delivered';
        message.notification.body = 'Your order has been successfully delivered. Click to view order details';
        message.notification.click_action = 'in.viato.app.BOOKING';
        break;
      case 'READING-EXTENDED' :
        message.notification.title = 'Extended rental period';
        message.notification.body = 'Hurray! Now you have '+body['extension_pricing']['period'] + ' more days to enjoy'+ body.item.title;
        message.notification.click_action = 'in.viato.app.BOOKING';
        break;
      case 'SCHEDULED FOR PICKUP' :
        message.notification.title = 'Scheduled for pickup';
        message.notification.body = body.item.title + ' is scheduled for pickup. We shall call you to confirm your availability';
        message.notification.click_action = 'in.viato.app.BOOKING';
        break;
      case 'RETURNED' :
        message.notification.title = 'Returned successfully';
        message.notification.body = 'We have picked up '+ body.item.title;
        message.notification.click_action = 'in.viato.app.BOOKING';
        break;
      default :
        return;
    }

    message.data.bookingId = bookingId;
    send(message, tokens);
  })
}

function notifyExpirey(){
  var message = _.extend({}, defaults);
  message.notification.click_action = 'in.viato.app.BOOKING';
  message.body.bookingId = "";
}

function notifyNewBooks() {
  var message = _.extend({}, defaults);
  message.notification.click_action = 'in.viato.app.CATEGORY';
  message.body.categoryId = "";
  message.body.categoryName = "";
}

function notifyCartRemaining(){

}

function send(message, tokens){
  sender.send(message, { registrationIds : tokens }, function (err, result) {
      if(err) console.error(err);
      else  console.log(result); //TODO update tokens based on message failure message
  });
}

function getTokens(userId){
  return db.User.findOne({_id : userId}).select('devices').exec().then(function(User){
    return _.pluck(User.devices, 'app_token');
  })
}
