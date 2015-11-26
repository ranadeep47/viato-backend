var gcm = require('node-gcm');
var _ = require('lodash');

var message = new gcm.Message({
    // collapseKey: 'demo',
    priority: 'high',
    // contentAvailable: true,
    // delayWhileIdle: true,
    // timeToLive: 3,
    restrictedPackageName: "in.viato.app",
    //dryRun: true,
    data: {
      title: "Read a book this weekend!",
      message: "Get ready for an exciting weekend, rent and read your favorite book today !"
    }
});

var db = require('../db');
var sender = new gcm.Sender('AIzaSyBo8mYCRkA9EBp8kjrqbu43C-GadTtVO64');


db.User.find().select('devices').exec().then(function(Users){
  var t = _.pluck(Users, 'app_token');
  return console.log(t);
  sender.send(message, { registrationIds: t }, function (err, result) {
      if(err) console.error(err);
      else  console.log(result);
  });
})
