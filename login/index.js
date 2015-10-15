var db = require('../db');
var Router = require('koa-router');
var is = require('is_js');
var login = new Router();
var _ = require('lodash');
var jwt = require('koa-jwt');

var utils = require('../utils');
var handleError = require('../errorHandler');
var sendOTP = require('../services/sms').sendOTP;

module.exports = login;

login.post('/', function*(){
  var ctx = this;

  if(!utils.checkBody(['device_id','mobile','accounts'], this.request.body)){
    return this.throw(400);
  }

  var deviceId  = this.request.body['device_id'];
  var mobile    = this.request.body['mobile'];
  var accounts  = this.request.body['accounts'];

  if(!deviceId.length
    || mobile.length != 10
    || !/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[789]\d{9}$/.test(mobile) ) {
      return this.throw(400, 'Please check your mobile number');
  }

  var otp = utils.newOTP();
  sendOTP(mobile, otp);
  //Check if mobile already exists in TempUsers
  var ok = yield db.TempUser
  .findOne({mobile : mobile}).exec()
  .then(function(tempUser){
    if(!tempUser) {
      //Create a new temp user
      var tuser = {
        mobile : mobile,
        otp : otp,
        device_id : deviceId,
        accounts : accounts || []
      }

      return db.TempUser
            .create(tuser)
            .then(function(tuser){
                return true;
            });
    }
    //Temp user exists, refresh OTP
    else {
      tempUser.set('otp', otp);
      tempUser.set('is_otp_verified', false);
      tempUser.set('otp_verified_at', null);
      //TODO : Update the new social accounts too ! .
      tempUser.save();
      return true;
    }
  })
  .catch(handleError);

  ok ? this.body = 'OTP Sent to '+mobile : this.throw(500)
})

login.post('/otp/verify', function*(){
  var ctx = this;

  if(!utils.checkBody(['mobile', 'otp'], this.request.body)){
    this.throw(400);
  }

  var mobile = this.request.body['mobile'];
  var otp = this.request.body['otp'].trim();

  if(otp.length !== 4 || mobile.length !== 10) {
    this.throw(400, 'Invalid OTP');
  }

  var token = yield db.TempUser.findOne({mobile : mobile}).exec()
  .then(function(tuser){
    if(tuser.get('is_otp_verified')) return tuser.get('_id')
    if(tuser.get('otp') !== otp) return false; //Not OK
    //Verified OK
    tuser.set('is_otp_verified', true);
    tuser.set('otp_verified_at', new Date());
    tuser.save();
    return tuser.get('_id')
  })
  .catch(handleError)

  token ? (this.body = {token : token}) : this.throw(400, 'Invalid OTP Code');
})

login.post('/complete', function*(){
  if(!utils.checkBody(['token', 'email'], this.request.body)) {
    this.throw(400);
  }

  var userId = this.request.body['token'];
  var email = this.request.body['email'];

  if(!is.email(email) || userId.length < 1) {
    this.throw(400, 'Invalid Email');
  }

  var token = yield db.TempUser.findById(userId).exec()
  .then(function(tuser){
    if(!tuser) return false;
    var mobile = tuser.get('mobile');
    return db.User.findOne({mobile : mobile}).exec()
          .then(function(user){
            var verificationToken = utils.emailToken();
            if(!user) {
              //Create user
              user = {
                mobile : mobile,
                email : {
                    email : email,
                    is_verified : false,
                    verified_at : null,
                    verification_token : verificationToken
                  },
                social_accounts : tuser.get('accounts'),
                devices : [{device_id : tuser.get('device_id'), platform : 'Android'}]
              }

              return db.User.create(user).then(function(user){
                 var session = {
                   userId : user.get('_id') //TODO : Add more here
                 }

                 var accessToken = jwt.sign(session, config['json-token-secret']);
                 user.set('access_token', accessToken);
                 user.save();
                 return accessToken;
              });
            }
            //User already exists
            var oldEmail = user.get('email');
            if(oldEmail.email === email) return user.get('access_token'); //Login in if its the same email address
            //Email updated.
            user.set('email.email', email);
            user.set('email.is_verified', false);
            user.set('email.verification_token', verificationToken);
            user.save();
            sendEmail(email, verificationToken);
            return user.get('access_token');
          })
  })
  .catch(handleError)

  token ? this.body = {access_token : token} : this.throw(400, 'Somethings wrong')
})

login.post('/otp/resend', function*(){
  if(! 'mobile' in this.request.body) {
    this.throw(400);
  }

  var mobile = this.request.body['mobile'];
  if(mobile.length !== 10) {
    this.throw(400, 'Invalid Mobile');
  }


  var ok = yield db.TempUser.findOne({mobile : mobile}).exec()
  .then(function(tuser){
    if(!tuser) return false;
    if(tuser.get('is_otp_verified')) return true;
    var otp = utils.newOTP();
    tuser.set('otp', otp);
    sendOTP(mobile, otp);
    return true;
  })
  .catch(handleError)

  ok ? this.body = 'OTP sent to '+mobile : this.throw(400);

})

function sendEmail(email, code) {
  console.log('Sending token %s to %s', code, email);
}
