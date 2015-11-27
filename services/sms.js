var axios   = require('axios');
var db      = require('../db');
var _       = require('lodash');

var API_URL = "https://control.msg91.com/api/sendhttp.php";
var API_KEY = config['sms-key'];

exports.sendOTP = sendOTP;
exports.informOrder = informOrder;
exports.sendMessage = sendMessage;

var Constants = require('../constants');

function sendOTP(to, code) {
  var message = 'VIATO OTP Code : '+ code + '. We need this to verify your mobile number';
  return sendMessage(to, message);
}


function informOrder(userId, status, body) {
  return db.User.findOne({_id : userId}).select('mobile').exec().then(function(User){

    var params = {
      authkey   : API_KEY,
      mobiles   : parseInt(User.mobile),
      sender    : 'VIATOU',
      route     : 4,
      country   : 91,
      response  : 'json'
    }

    var message;
    switch(status) {
      case 'CONFIRMED' :
        message = 'Your order no. #' +
        body['order_id'].toUpperCase() + ' for Rs.' +
        body['booking_payment']['total_payable'] +
        ' from Viato has been confirmed. Your books will be delivered soon. Please call ' + Constants['ContactNumber'] + ' for any inquiries.';
        break;

      case 'CANCELLED' :
        message = 'Sorry your order #'+ body['order_id'].toUpperCase() + ' has been cancelled '+
        'due to unavailibity of books. Please call ' + Constants['ContactNumber'] + ' for any inquiries. Thank you for using Viato.';
        break;
      // case 'DELIVERED' :
      //   var message = 'Your order from viato has been successfully delivered. Thank you for choosing us';
      //   break;
      //
      // case 'RETURNED' :
      //   var message = 'Your rental from viato ' +
      //   body['item']['title'] +
      //   ' has been successfully picked up.';
      //   break;

      default :
        return;
    }

    return sendMessage(User.mobile, message);
  });
}

function notifyExpirey(userId, rental){
  var message = 'Greetings from Viato, You rented ' +
  rental.item.title + ' on ' +
  rental['delivered_at'].toLocaleDateString('en-US', 'Asia/Calcutta') +
  ' and the rental period is expiring tomorrow. You can extend the rental in your app';

  return db.User.findOne({_id : userId}).select('mobile').exec().then(function(User){
    var mobile = User['mobile'];
    return sendMessage(mobile, message);
  });
}


function sendMessage(mobile, message){
  var params = {
    authkey   : API_KEY,
    mobiles   : parseInt(mobile),
    sender    : 'VIATOU',
    route     : 4,
    country   : 91,
    response  : 'json'
  }

  params.message = encodeURIComponent(message);
  return axios.get(API_URL, {params : params});
}
