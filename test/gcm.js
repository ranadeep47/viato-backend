var gcm = require('node-gcm');

var message = new gcm.Message({
    // collapseKey: 'demo',
    priority: 'high',
    // contentAvailable: true,
    // delayWhileIdle: true,
    // timeToLive: 3,
    restrictedPackageName: "in.viato.app",
    //dryRun: true,
    data: {
      title: "Rent a bestseller for the weekend!",
      message: "Get ready for an exciting weekend, rent and read a bestseller today !"
    }
});

var t = ['']
var sender = new gcm.Sender('AIzaSyBo8mYCRkA9EBp8kjrqbu43C-GadTtVO64');

sender.send(message, { registrationIds: t }, function (err, result) {
    if(err) console.error(err);
    else  console.log(result);
});
