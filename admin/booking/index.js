var db = require('../../db');
var Router = require('koa-router');
var booking = new Router();
var _ = require('lodash');

/*
 * Get all the active bookings, ie : PLACED, CONFIRMED, DISPATCHED - > DELIVERED
 * PICKUPS which are SCHEDULED FOR PICKUP
*/

booking.get('/', function*(){
  var notCompletedStatus = ['PLACED', 'CONFIRMED', 'DISPATCHED', '']
  // var placed = getBookings('PLACED');
  // placed.then(function(docs){
  //   console.log(docs);
  // })

  var pickups = getPickups();
  pickups.then(function(docs){
    console.log(docs);
  })
});

function getBookings(status, offset, limit) {
  var offset = offset || 0;
  var limit = limit || 0;
  return db.Booking.find({status : status})
  .select('user_id order_id delivery_address rentals')
  .populate('user_id', 'mobile email')
  .skip(offset)
  .limit(limit)
  .exec()
  .then(function(docs){
    var docs = docs.map(function(doc){
      var rentals = _.pluck(doc.rentals, 'item');
      var address = doc['delivery_address'];
      address = [address['flat'], address['street'], address['locality']['name']].join(',');
      return {
        userEmail   : doc['user_id']['email']['email'],
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

function getPickups(offset, limit){
  var offset = offset || 0;
  var limit = limit || 0;

  return db.Booking.find({'rentals.status' : 'SCHEDULED FOR PICKUP'})
  .select('user_id order_id delivery_address rentals')
  .populate('user_id', 'mobile email')
  .skip(offset)
  .limit(limit)
  .exec()
  .then(function(docs){
    var docs = docs.map(function(doc){

      var rentals = doc.rentals.map(function(r){ _.pick(r, 'item expires_at'.split(' '))});
      var address = doc['delivery_address'];
      address = [address['flat'], address['street'], address['locality']['name']].join(',');
      return {
        userEmail   : doc['user_id']['email']['email'],
        userMobile  : doc['user_id']['mobile'],
        userAddress : address,
        rentals     : rentals
      }
    });

    return docs;
  })
}



module.exports = booking;
