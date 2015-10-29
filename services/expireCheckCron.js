var cron = require('cron').CronJob;
var db = require('../db');
var moment = require('moment');

var job = new CronJob(
  '3 15 * * *', // Run it every 00:01:00 minute of everyday
  checkExpires,
  postCheckComplete,
  true, /* Start the job right now */
  'Asia/Kolkata' /* Time zone of this job. */
);

function checkExpires(){
  //Check all active bookings
  var completedBookings = ['COMPLETED', 'CANCELLED'];
  //Get all bookings which are incomplete whose rentals have expires_at as today,
  //update its rental status as SCHEDULED FOR PICKUP
  var today = moment().hours(0).minutes(0).seconds(0).milliseconds(0);
  console.log(today);
  // db.Booking.update({status : {$nin : completedBookings}, 'rentals.expires_at' : }, {})
}

function postCheckComplete() {
  console.log('COMPLETED');
}
