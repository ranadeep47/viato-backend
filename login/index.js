var db = require('../db');
var Router = require('koa-router');
var is = require('is_js');
var login = new Router();
var _ = require('lodash');
var jwt = require('koa-jwt');

var moment = require('moment');

var utils = require('../utils');
var sendOTP = require('../services/sms').sendOTP;

module.exports = login;

login.post('/', function*(){
  var ctx = this;

  if(!utils.checkBody(['mobile','device_id'], this.request.body)){
    return this.throw(400);
  }

  var imei      = this.request.body['device_id'];
  var mobile    = this.request.body['mobile'];

  if(!imei.length
    || mobile.length != 10
    || !/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[789]\d{9}$/.test(mobile) ) {
      return this.throw(400, 'Please check your mobile number');
  }

  var ok = yield db.TempUser.find({imei : imei}).exec().then(function(tuser){
    if(tuser.length && tuser.length > 2) {
      //Limit exceeded. Only a maximum of 2 accounts allowed per device
      //TODO
      if(!_.find(tuser, {mobile : mobile})){
        return ctx.throw(400, 'This device has exceeded its maximum allowed number of accounts. Please login with your old mobile number');
      }
    }

    var otp = utils.newOTP();
    sendOTP(mobile, otp);
    //Check if mobile already exists in TempUsers

    return db.TempUser.findOne({mobile : mobile}).exec()
    .then(function(tempUser){
      if(!tempUser) {
        //Create a new temp user
        var tuser = {
          mobile            : mobile,
          imei              : imei,
          otp               : otp,
          otp_generated_at  : new Date()
        }

        return db.TempUser
              .create(tuser)
              .then(function(tuser){
                  return true;
              });
      }
      //Temp user exists, refresh OTP
      else {
        tempUser.set('imei', imei);
        tempUser.set('otp', otp);
        tempUser.set('otp_generated_at', new Date());
        tempUser.set('is_otp_verified', false);
        tempUser.set('otp_verified_at', null);
        //TODO : Update the new social accounts too ! .
        tempUser.save();
        return true;
      }
    })
  })

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
    this.throw(400, 'Invalid OTP Code');
  }

  var token = yield db.TempUser.findOne({mobile : mobile}).exec()
  .then(function(tuser){
    if(tuser.get('otp') !== otp) return false; //Not OK
    //Expire OTP if > 1 hr old
    var generatedAt = moment(tuser.get('otp_generated_at'));
    var now  = moment();
    var duration = moment.duration(now.diff(generatedAt));
    var diff = duration.asHours();
    if(diff > 1) {
      return false;
    }
    //Verified OK
    if(tuser.get('otp_generated_at'))
    tuser.set('is_otp_verified', true);
    tuser.set('otp_verified_at', new Date());
    tuser.save();
    return tuser['_id'];
  })

  token ? (this.body = token.toString()) : this.throw(400, 'Invalid OTP Code');
})

login.post('/complete', function*(){
  if(!utils.checkBody(['token', 'email','accounts'], this.request.body)) {
    this.throw(400);
  }

  var userId    = this.request.body['token'];
  var email     = this.request.body['email'];
  var accounts  = this.request.body['accounts'];
  var appToken  = this.request.body['app_token'] || ''

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
                social_accounts : null,
                copouns : [{
                  number      : 100,
                  type        : 'PERCENT',
                  code        : 'VIATOFREE',
                  expires_at  : new Date(2015, 11, 15)
                }],
                devices : [{device_id : tuser.get('imei'), app_token : appToken}]
              }

              return db.User.create(user).then(function(user){

                 var session = {
                   userId : user['_id'], //TODO : Add more here
                   updated : Date.now()
                 }

                 var accessToken = jwt.sign(session, config['json-token-secret']);
                 user.set('access_token', accessToken);
                 user.save();
                 db.User.addAccounts(user['_id'], accounts);
                 return {access_token : accessToken, user_id : user.get('_id')}
              });
            }
            //User already exists
            var oldEmail = user.get('email');
            var accessToken;
            if(oldEmail.email !== email) {
              //Email updated.
              user.set('email.email', email);
              user.set('email.is_verified', false);
              user.set('email.verification_token', verificationToken);
              sendEmail(email, verificationToken);
            }

            var session = {
              userId : user['_id'], //TODO : Add more here
              updated : Date.now()
            }

            accessToken = jwt.sign(session, config['json-token-secret']);
            user.set('access_token', accessToken);

            //Update or add devices & appToken;
            //if account with imei exists update appToken
            var updated = false;
            user.devices.forEach(function(device, i){
              if(device['device_id'] === tuser['imei']) {
                updated = true;
                device['updated_at'] = new Date();
                device['app_token']  = appToken;
              }
            });

            if(!updated){
              user.devices.push({
                device_id   : tuser.get('imei'),
                app_token   : appToken,
                created_at  : new Date(),
                updated_at  : new Date()
              })
            }

            user.save();
            db.User.addAccounts(user.get('_id'), accounts);
            return {access_token : accessToken, user_id : user.get('_id')}
          })
  })

  token ? this.body = token : this.throw(400, 'Unable to generate access token')
})

login.post('/otp/resend', function*(){
  if(! 'mobile' in this.request.body) {
    return this.throw(400);
  }

  var mobile = this.request.body['mobile'];
  if(mobile.length !== 10) {
    return this.throw(400, 'Invalid Mobile');
  }


  var ok = yield db.TempUser.findOne({mobile : mobile}).exec()
  .then(function(tuser){
    if(!tuser) return false;
    var otp;
    if(tuser.get('is_otp_verified')) return true;
    var duration = new Date() - tuser['otp_generated_at'];
    if( moment.duration(duration).asHours() < 1 ) {
      otp = tuser['otp'];
    }
    else {
      otp = utils.newOTP();
      tuser.set('otp_generated_at', new Date);
      tuser.set('otp', otp);
    }
    sendOTP(mobile, otp);
    return true;
  })

  ok ? this.body = 'OTP sent to '+mobile : this.throw(500, 'Problem sending OTP');

})

function sendEmail(email, code) {
  console.log('Sending token %s to %s', code, email);
}
