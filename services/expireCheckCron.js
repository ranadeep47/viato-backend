var CronJob = require('cron').CronJob;
var db = require('../db');
var moment = require('moment');

var job = new CronJob(
  // '1 0 * * *', // Run it every 00:01:00 minute of everyday
  '26 17 * * *', // Run it every 00:01:00 minute of everyday
  checkExpires,
  true, /* Start the job right now */
  'Asia/Kolkata' /* Time zone of this job. */
);

function checkExpires(){
  var today    = moment().hours(0).minutes(0).seconds(0).milliseconds(0);
  var tomorrow = moment(today).add(1, 'days');

  today = today.toDate();
  tomorrow = tomorrow.toDate();

  db.Booking.find({
    'rentals.status'     : {$in : ['READING', 'READING-EXTENDED']},
    'rentals.expires_at' : {$gte : today , $lt : tomorrow}
  })
  .select('rentals')
  .exec()
  .then(function(Bookings){
    console.log('Active bookings : ',Bookings.length);
    Bookings.forEach(function(booking){
      var rentals = booking.rentals;
      rental.forEach(function(rental){
        if(rental.status !== 'CANCELLED') {
          if(rental.expires_at.getTime() === today.getTime()){
            //Mark expires
            rental.status = 'SCHEDULED FOR PICKUP';
          }
        }
      })
      booking.save();
    });
  });
}
