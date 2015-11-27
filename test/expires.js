//
var env = process.env['NODE_ENV'];
var config = require('../config')[env];
global.config = config;

var db = require('../db');
var gcm = require('../services/gcm');
var sms = require('../services/sms');
var moment = require('moment');

var today    = moment().hours(0).minutes(0).seconds(0).milliseconds(0);
var tomorrow = moment(today).add(1, 'days');
var dayaftertomorrow = moment(tomorrow).add(1, 'days');

setExpires('3v9eg', tomorrow.toDate());

function setExpires(orderId, date){
  db.Booking.findOne({order_id : orderId}).select('rentals').exec()
  .then(function(Booking){
    var Rentals = Booking.rentals;
    Rentals.forEach(function(rental){
      rental.expires_at = date
    })

    Booking.save().then(function(){
      console.log('expires_at set, calling check function');
      check(orderId);
    })
  })
}

function check(orderId) {
  dayaftertomorrow = dayaftertomorrow.toDate();
  db.Booking.find({
    order_id             : orderId,
    'rentals.status'     : {$in : ['READING', 'READING-EXTENDED']},
    'rentals.expires_at' : {$gte : tomorrow , $lt : dayaftertomorrow}
  })
  .select('rentals user_id')
  .exec()
  .then(function(Bookings){
    Bookings.forEach(function(booking){
      console.log('Booking found');
      var bookingId = booking['_id'];
      var userId = booking['user_id'];

      if(rental.status === 'READING' || rental.status === 'READING-EXTENDED') {
        if(rental.expires_at.getTime() === tomorrow.getTime()){
          //Mark expires
          console.log('Calling gcm and sms ');
          gcm.notifyExpirey(userId, bookingId, rental);
          sms.notifyExpirey(userId, rental);
        }
      }
    })
  })
}
