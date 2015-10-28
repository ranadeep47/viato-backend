var db = require('../../db');
var Router = require('koa-router');
var booking = new Router();
var _ = require('lodash');

/*
 * Get all the active bookings, ie : PLACED, CONFIRMED, DISPATCHED - > DELIVERED
 * PICKUPS which are SCHEDULED FOR PICKUP
*/

booking.get('/', function*(){
  var notCompletedStatus = ['PLACED', 'CONFIRMED', 'DISPATCHED'];
  var promises = notCompletedStatus.map(function(status){ return getBookings(status)});
  promises.push(getPickups());

  var obj = yield Promise.all(promises).then(function(results){
      results = _.zipObject(notCompletedStatus.concat('PICKUPS'), results);
      return results;
  });

  yield this.render('booking-home', obj);
});

booking.get('/:orderId', function*() {
  // var orderId = this.params['orderId'];
  // db.Booking.findOne({order_id : orderId})
})

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
      var rentalFields = '_id item status'.split(' ');
      var rentals = doc.rentals.map(function(r) { return _.pick(r, rentalFields)});
      var address = doc['delivery_address'];
      address = [address['flat'], address['street'], address['locality']['name']].join(',');
      return {
        userEmail   : doc['user_id']['email']['email'],
        userMobile  : doc['user_id']['mobile'],
        userAddress : address,
        rentals     : rentals,
        orderId     : doc['order_id']
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
      var rentalFields = '_id item expires_at'.split(' ');
      var rentals = doc.rentals.map(function(r){ return _.pick(r, rentalFields)});
      var address = doc['delivery_address'];
      address = [address['flat'], address['street'], address['locality']['name']].join(',');
      return {
        userEmail   : doc['user_id']['email']['email'],
        userMobile  : doc['user_id']['mobile'],
        userAddress : address,
        rentals     : rentals,
        orderId     : doc['order_id']
      }
    });

    return docs;
  })
}



module.exports = booking;
