var db = require('../db');

module.exports = function*(next){
  yield next;
  var userId = this.state.user['userId'];
  if(!userId) return;
  var appToken = this.get('X-APP-TOKEN');
  var deviceId = this.get('X-DEVICE-ID');

  var User = yield db.User.findOne({_id : userId}).select('devices').exec();
  if(!User.devices.length) {
    //For a few users who didnt have a device when using version < 1.0.3
    var device = {
      app_token   : appToken,
      device_id   : deviceId,
      created_at  : new Date(),
      updated_at  : new Date()
    }

    User.devices.push(device);
  }
  else {
    //Update device token
    User.devices.forEach(function(device){
      if(device.device_id === deviceId){
        //Update app token
        device['app_token'] = appToken;
        device['updated_at'] = new Date();
      }
    });
  }

  User.save();
}
