var db = require('../../db');
var Router = require('koa-router');
var booking = new Router();
var _ = require('lodash');
var moment = require('moment');

var gcm = require('../../services/gcm');
var sms = require('../../services/sms');
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

booking.get('/all', function*(){
  var Bookings = yield db.Booking.find().populate('user_id', 'mobile email').sort({_id : -1}).exec();
  yield this.render('all-bookings', {Bookings : Bookings});
})

booking.get('/:orderId', function*(){
  var orderId = this.params['orderId'];
  var Booking = yield db.Booking
  .findOne({order_id : orderId})
  .populate('user_id', 'mobile email')
  .exec();

  yield this.render('booking-detail', Booking);
})

booking.post('/confirm', function*(){
  var orderId = this.request.body['orderId'];
  var rentals = this.request.body['rentals'];

  var Booking = yield db.Booking.findOne({order_id : orderId}).exec();
  Booking.status = 'CONFIRMED';

  Booking.rentals.forEach(function(rental){
    if(rentals[rental._id.toString()]) {
      //If confirmed, set expected delivered_at
      rental.expected_delivery_at = moment().add(2, 'days').toDate();
      // gcm.notifyOrder(Booking['user_id'], 'CONFIRMED', rental, Booking['_id']);
    }
    else {
      //rental is cancelled
      rental.status = 'CANCELLED';
      //Remove its pricing booking, schedule refund for online payments
      var total = Booking['booking_payment']['total'] + Booking['booking_payment']['discount'];
      var fractionOfTotal = rental.item.pricing.rent / total;
      var refund = Math.round(fractionOfTotal * Booking['booking_payment']['total_payable']);
      if(refund <= total_payable){
        Booking['booking_payment']['total_payable'] -= refund;
      }

      //Notification
      gcm.notifyOrder(Booking['user_id'], rental['status'], rental, Booking['_id']);
    }
  });

  Booking.save(function(){
    //SMS
    sms.informOrder(Booking['user_id'], Booking['status'], Booking);
  });
  this.body = 'Booking confirmed';
});

booking.post('/cancel', function*() {
  var orderId = this.request.body['orderId'];
  var Booking = yield db.Booking.findOne({order_id : orderId}).exec();
  Booking.status = 'CANCELLED';
  Booking.rentals.forEach(function(rental){
    rental.status = 'CANCELLED'
    // gcm.notifyOrder(Booking['user_id'], rental['status'], rental, Booking['_id']);
  });

  Booking.save(function(){
      sms.informOrder(Booking['user_id'], Booking['status'], Booking);
  });

  this.body = 'Booking cancelled';
})

booking.post('/dispatch', function*() {
  var orderId = this.request.body['orderId'];
  var Booking = yield db.Booking
                .findOne({order_id : orderId})
                .select('status user_id')
                .exec();

  Booking.status = 'DISPATCHED';
  gcm.notifyOrder(Booking['user_id'], Booking['status'], {}, Booking['_id']);
  Booking.save();
  this.body = 'Booking dispatched';

})

booking.post('/deliver', function*() {
  var orderId = this.request.body['orderId'];
  var Booking = yield db.Booking.findOne({order_id : orderId})
                .select('rentals status booking_payment user_id')
                .exec();

  Booking.status = 'DELIVERED';
  gcm.notifyOrder(Booking['user_id'], Booking['status'], {}, Booking['_id']);
  Booking.booking_payment.is_paid = true;
  Booking.booking_payment.paid_at = new Date();

  Booking.rentals.forEach(function(rental){
    //Set expires_at, is_delivered, delivered_at,
    var period = rental.item.pricing.period;
    if(rental.status !== 'CANCELLED') {
      rental.expires_at = moment().add(period + 1, 'days')
                          .hours(0).minutes(0).seconds(0).milliseconds(0)
                          .toDate();

      rental.status = 'READING';
      rental.is_delivered = true;
      rental.delivered_at = new Date();
    }
  });

  Booking.save();
  this.body = 'Booking delivered';
})

booking.post('/pickup', function*(){
  var orderId = this.request.body['orderId'];
  var Booking = yield db.Booking.findOne({order_id : orderId})
                .select('rentals status user_id').exec();

  Booking.rentals.forEach(function(rental){
    if(rental.status === 'SCHEDULED FOR PICKUP') {
      rental.status = 'RETURNED';
      rental.is_picked = true;
      rental.pickup_done_at = new Date();

      //Notification
      gcm.notifyOrder(Booking['user_id'], rental['status'], rental, Booking['_id']);
    }
  });

  var statuses = _.pluck(Booking.rentals, 'status');
  var others   = _.without(statuses, 'RETURNED', 'CANCELLED');
  if(others.length) Booking.status = 'PARTIALLY COMPLETED';
  else Booking.status = 'COMPLETED';

  Booking.save();
  this.body = 'Picked up successfuly';
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
      var rentals = doc.rentals.filter(function(r){ return r.status === 'SCHEDULED FOR PICKUP' });
      var rentals = rentals.map(function(r){ return _.pick(r, rentalFields)});
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
