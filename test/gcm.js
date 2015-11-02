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
        key1: 'message1',
        key2: 'message2'
    },
    notification: {
        title: "Hello, World",
        icon: "ic_launcher",
        body: "This is a notification that will be displayed ASAP."
    }
});

var regTokens = ['fil7ezkWvJ0:APA91bED7LxPkml4JzofPnMOhKps5z_vt66yn2RwY5FpNtsLT1HyaX3lEYe6XvP_tqhFCaDnKHVlvGgMCr1c6ggDueWDpcIDx6wPtOw2EKqABvmWONy6cJe_zzoiFHGs3MoKWgmYLPd0'];
var sender = new gcm.Sender('AIzaSyBo8mYCRkA9EBp8kjrqbu43C-GadTtVO64');

sender.send(message, { registrationTokens: regTokens }, function (err, result) {
    if(err) console.error(err);
    else  console.log(result);
});
