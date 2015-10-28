var db = require('../../db');
var Router = require('koa-router');
var booking = new Router();
var _ = require('lodash');

/*
 * Get all the active bookings, ie : PLACED, CONFIRMED, DISPATCHED - > DELIVERED
 * PICKUPS which are SCHEDULED FOR PICKUP
*/

booking.get('/', function*(){
  var deliveries = db.Booking.find({status : {$nin : completedStatus}}).exec();
  var placed = getBookings('PLACED');
  placed.then(function(docs){
    console.log(docs);
  })
});

function getBookings(status, offset, limit) {
  var offset = offset || 0;
  var limit = limit || 0;
  return db.Bookings({status : status})
  .select('order_id delivery_address rentals')
  .populate('user_id', 'mobile email')
  .skip(offset)
  .limit(limit)
  .exec()
  .then(function(docs){
    var docs = docs.map(function(doc){
      var rentals = _.plick(doc.rentals, 'item');
      var address = doc['delivery_address'];
      address = [address['flat'], address['street'], address['locality']['name']].join(',');
      return {
        userEmail   : doc['user_id']['email'],
        userMobile  : doc['user_id']['mobile'],
        userAddress : address,
        rentals     : rentals
      }
    });

    return docs;
  })
  .catch(function(err){
    console.log(err);
    return [];
  })
}



module.exports = booking;
