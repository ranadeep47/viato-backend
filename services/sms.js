var axios = require('axios');
var db = require('../db');

var API_URL = "https://control.msg91.com/api/sendhttp.php";
var API_KEY = config['sms-key'];

exports.sendOTP = sendOTP;
exports.informOrder = informOrder;

var Constants = require('../constants');

function sendOTP(to, code) {
  var message = 'VIATO OTP Code : '+ code + '. We need this to verify your mobile number';
  var number = parseInt(to);
  var params = {
    authkey   : API_KEY,
    mobiles   : number,
    message   : encodeURIComponent(message),
    sender    : 'VIATOU',
    route     : 4,
    country   : 91,
    response  : 'json'
  }

  return axios.get(API_URL, {params : params})
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

    switch(status) {
      case 'CONFIRMED' :
        var message = 'Your order no. #' +
        body['order_id'] + ' for Rs.' +
        body['booking_payment']['total_payable'] +
        ' from Viato has been confirmed and will be delivered soon. Please call ' + Constants['ContactNumber'] + ' for any issues.';
        break;

      case 'CANCELLED' :
        var message = 'Sorry your order '+ Booking['order_id'] + ' has been cancelled '+
        'due to unavailibity. Please call ' + Constants['ContactNumber'] + ' for any inquires. Thank you for using Viato.';
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

    params.message = encodeURIComponent(message);
    return axios.get(API_URL, {params : params});
  });
}
