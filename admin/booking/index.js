var db = require('../../db');
var Router = require('koa-router');
var booking = new Router();

booking.get('/', function*(){
  var CompleteStatus = ['COMPLETED', 'CANCELLED'];
  db.Booking
    .find({status : {$nin : CompleteStatus}})
    .populate('user_id', 'name')
    .sort({booked_at : -1})
    .exec().then(function(bookings){

  });
})

module.exports = booking;
