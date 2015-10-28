var cron = require('cron');
var db = require('../db');

//Check all active bookings
var completedBookings = ['COMPLETED', 'CANCELLED'];
//Get all bookings which are incomplete whose rentals have expires_at as today,
//update its rental status as SCHEDULED FOR PICKUP
db.Booking.update({status : {$nin : completedBookings}, 'rentals.expires_at' : }, {})
