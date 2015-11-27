var CronJob = require('cron').CronJob;
var db = require('../db');
var moment = require('moment');

var sms = require('./sms');
var gcm = require('./gcm');

var job = new CronJob(
  '1 0 * * *', // Run it every 00:01:00 minute of everyday
  checkExpires,
  null,
  true, /* Start the job right now */
  'Asia/Kolkata' /* Time zone of this job. */
);

function checkExpires(){
  var today    = moment().hours(0).minutes(0).seconds(0).milliseconds(0);
  var tomorrow = moment(today).add(1, 'days');
  var dayaftertomorrow = moment(tomorrow).add(1, 'days');

  today = today.toDate();
  tomorrow = tomorrow.toDate();

  db.Booking.find({
    'rentals.status'     : {$in : ['READING', 'READING-EXTENDED']},
    'rentals.expires_at' : {$gte : today , $lt : tomorrow}
  })
  .select('rentals')
  .exec()
  .then(function(Bookings){
    Bookings.forEach(function(booking){
      var rentals = booking.rentals;
      rentals.forEach(function(rental){
        if(rental.status === 'READING' || rental.status === 'READING-EXTENDED') {
          if(rental.expires_at.getTime() === today.getTime()){
            //Mark expires
            rental.status = 'SCHEDULED FOR PICKUP';
          }
        }
      })
      booking.save();
    });
  });

  //Notifiy if book expires tomorrow
  dayaftertomorrow = dayaftertomorrow.toDate();
  db.Booking.find({
    'rentals.status'     : {$in : ['READING', 'READING-EXTENDED']},
    'rentals.expires_at' : {$gte : tomorrow , $lt : dayaftertomorrow}
  })
  .select('rentals user_id')
  .exec()
  .then(function(Bookings){
    Bookings.forEach(function(booking){
      var bookingId = booking['_id'];
      var userId = booking['user_id'];
      var rentals = booking.rentals;
      rentals.forEach(function(rental){
        if(rental.status === 'READING' || rental.status === 'READING-EXTENDED') {
          if(rental.expires_at.getTime() === tomorrow.getTime()){
            //Mark expires
            gcm.notifyExpirey(userId, bookingId, rental);
            sms.notifyExpirey(userId, rental);
          }
        }
      })
    })
  })
}
