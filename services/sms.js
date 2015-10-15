var axios = require('axios');

var API_URL = "https://control.msg91.com/api/sendhttp.php";
var API_KEY = config['sms-key'];

exports.sendOTP = sendOTP;

function sendOTP(to, code) {
  var message = 'VIATO OTP Code : '+ code + '. We need this to verify your mobile number';
  var number = parseInt(to);
  var params = {
    authkey   : API_KEY,
    mobiles   : number,
    message   : encodeURIComponent(message),
    sender    : 'VIATO',
    route     : 4,
    country   : 91,
    response  : 'json'
  }

  return axios.get(API_URL, {params : params})
  .then(function(r){ console.log(r)});
  .catch(function(e) { console.log(e); })
}
