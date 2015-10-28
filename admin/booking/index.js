var db = require('../../db');
var Router = require('koa-router');
var booking = new Router();

/*
 * Get all the active bookings, ie : PLACED, CONFIRMED, DISPATCHED - > DELIVERED
 * PICKUPS which are SCHEDULED FOR PICKUP
*/

booking.get('/', function*(){

});

Booking.get('/placed', function*(){

});

Booking.get('/confirmed', function*(){

});

Booking.get('/dispatched', function*(){

});

Booking.get('/pickups', function*(){

});

module.exports = booking;
