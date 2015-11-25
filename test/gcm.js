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
      title: "Hello, World",
      icon: "ic_launcher",
      message: "This is a notification that will be displayed ASAP.",
      click_action: "in.viato.app.CATEGORY",
      categoryId: "56368178a4824eb615732bd4",
      categoryName: "Politics & History"
    }
});

var regTokens = ['f8GkzMLg7j8:APA91bHlD3QaPIW8Bhv6pKxG1OOhoNtnHOEaEWmc9UPqCRDgFkBZnyX09mhiukZSXXsntXlp4MQI_7x8X9fv2TdZ_L217CZEI6pzVnX0ZyTZozN0DmVd65X67xZAVuKpvTeJ6Z4VGGzc'];
var sender = new gcm.Sender('AIzaSyBo8mYCRkA9EBp8kjrqbu43C-GadTtVO64');

sender.send(message, { registrationIds: regTokens }, function (err, result) {
    if(err) console.error(err);
    else  console.log(result);
});
