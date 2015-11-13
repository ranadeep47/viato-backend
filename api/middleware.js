var db = require('../db');

module.exports = function*(next){
  yield next;
  var userId = this.state.user['userId'];
  if(!userId) return;
  var appToken = this.get('X-APP-TOKEN');
  var deviceId = this.get('X-DEVICE-ID');

  var User = yield db.User.findOne({_id : userId}).select('devices').exec();
  if(!User.devices.length) {
    var device = {
      app_token   : appToken,
      device_id   : deviceId,
      created_at  : new Date(),
      updated_at  : new Date()
    }

    User.devices.push(device);
    User.save();
  }
  
}
