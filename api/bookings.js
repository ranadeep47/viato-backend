var Router = require('koa-router');
var bookings = new Router();
var db = require('../db');
var utils = require('../utils');
var moment = require('moment');
var _ = require('lodash');
var ObjectId = require('mongoose').Types.ObjectId;

var reverseGeoCoding = require('../services/reverseGeocoding');
var paymentService = require('../services/payments');

module.exports = bookings;

bookings.get('/', function*(){
  var userId = this.state.user['userId'];
  this.body = yield db.Booking
  .find({user_id : userId})
  .select('-user_id')
  .sort({booked_at : -1}).exec()
  .then(function(bookings){
    return bookings;
  });
})

bookings.get('/:bookingId', function*(){
  var userId = this.state.user['userId'];
  var bookingId = this.params['bookingId'];
  if(!bookingId) return this.throw(400);

  this.body = yield db.Booking.getBookingDetail(userId, bookingId);
})

bookings.post('/', function*(){
  var userId = this.state.user['userId'];
  var ctx = this;
  if(!utils.checkBody(['addressId'], this.request.body)) return this.throw(400);

  var addressId = this.request.body['addressId'];
  var copoun    = this.request.body['copoun'];
  if(copoun) copoun = copoun.trim();

  var fields = ['cart', 'addresses','copouns'];
  this.body = yield db.User.findOne({_id : userId}).select(fields.join(' ')).exec()
  .then(function(user){
    if(!user) throw new Error('Invalid userId');
    var address = _.find(user.addresses, function(a){ return a['_id'].toString() === addressId});
    if(!address) throw new Error('Invalid addressId');
    //Got a valid address, create booking from the cart
    //Check if we serve that locality
    return reverseGeoCoding.isAddressServed(address).then(function(isServed){
      if(isServed.is_supported){
        var cart = user.cart;
        var copouns = user.copouns;
        if(!cart.length) return ctx.throw(400, 'Cart is empty!');

        //Check if there are no pending bookings with more than 1 book in READING / READING - EXTENDED
        return db.Booking.find({user_id : userId, status : {$nin : ['COMPLETED', 'CANCELLED']}}).exec().then(function(bookings){
          if(bookings.length > 1) {
            return ctx.throw(400, 'Please return the rented books to continue booking.');
          }
          else if (bookings.length === 1) {
            var ExistingBooking = bookings[0];
            var RentalsPending = 0;
            ExistingBooking.rentals.forEach(function(r){
              var RentalDoneStatuses = ['RETURNED', 'CANCELLED', 'SCHEDULED FOR PICKUP'];
              if(RentalDoneStatuses.indexOf(r['status']) < 0) {
                ++RentalsPending;
              }
            });

            if(RentalsPending > 1) {
              return ctx.throw(400, 'Please return the rented books to continue booking.');
            }
          }
          //Ok . Proceed with booking
          var rentals = cart.map(function(rentalItem){
            return {
              item : rentalItem,
              expires_at : moment()
                  .add(rentalItem.pricing.period, 'days')
                  .hours(0)
                  .minutes(0)
                  .seconds(0)
                  .milliseconds(0)
                  .toDate(),
              status : 'YET TO DELIVER',
              extension_pricing : {
                _id     : new ObjectId(),
                rent    : rentalItem.pricing.rent / 2,
                period  : rentalItem.pricing.period / 2
              }
            }
          });

          var payment = paymentService.bookingPayment(cart, copouns, copoun);

          var booking = {
            user_id : userId,
            order_id : Math.random().toString(32).slice(4),
            status  : 'PLACED',
            delivery_address : address,
            pickup_address : address,
            rentals : rentals,
            booking_payment : payment
          };

          db.Booking.create(booking).then(function(Booking){
            if(copoun) {
              if(paymentService.validateCopoun(cart, copouns, copoun).isApplicable){
                db.User.updateCopounApplied(userId, Booking['booking_payment']['copoun_applied']);
              }
            }
            //Empty cart
            db.User.emptyCart(userId);
          });

          return booking['order_id'];
        })
      }
      else {
        return ctx.throw(400, 'Sorry we dont serve yet at the address specified');
      }
    })
  })
})

bookings.post('/rents/extend', function*(){
  var userId = this.state.user['userId'];
  var rentId = this.request.body['rentId'];
  if(!rentId || rentId.length !== 24) {
    return this.throw(400);
  }

  var ctx = this;

  var message = yield db.Booking.findOne({user_id : userId, 'rentals._id' : rentId},{"rentals.$" : 1}).exec()
  .then(function(booking){
    var rental = booking.rentals[0];
    if(rental.status === 'CANCELLED') return ctx.throw(400, 'Cancelled orders cannot be returned');
    if(booking.status === 'PLACED') return ctx.throw(400, 'Cannot return the book.');

    if(!rental.is_picked &&
      !rental.is_extended &&
      rental.pickup_requested_at === null) {
      var period = rental.item.pricing.period;
      var extension_cost = rental.extension_pricing.rent;
      var extension_period = rental.extension_pricing.period;
      //Extend
      var extension_payment = {
        payment_mode : 'COD',
        total_payable : extension_cost
      }

      var updateParams = {
        "rentals.$.status"              : 'READING-EXTENDED',
        "rentals.$.expires_at"          : moment(rental.expires_at).add(period, 'days').toDate(),
        "rentals.$.is_extended"         : true,
        "rentals.$.extended_at"         : new Date(),
        "rentals.$.extension_payment"   : extension_payment
      }

      return db.Booking.findOneAndUpdate({user_id : userId, 'rentals._id' : rentId}, {$set : updateParams},{new : true}).exec()
      .then(function(booking){
        return 'Rental extended for '+extension_period+' more days.';
      })
    }
    else return ctx.throw(400,'Sorry you have already extended the rental tenure');
  })

  this.body = message;

})

bookings.post('/rents/return', function*(){
  var userId = this.state.user['userId'];
  var rentId = this.request.body['rentId'];
  if(!rentId || rentId.length !== 24) {
    return this.throw(400);
  }

  var ctx = this;
  var message = yield db.Booking.findOne({user_id : userId, 'rentals._id' : rentId},{"rentals.$" : 1}).exec()
  .then(function(booking){
    var rental = booking.rentals[0];
    if(rental.status === 'CANCELLED') return ctx.throw(400, 'Cancelled orders cannot be returned')
    if(booking.status === 'PLACED') return ctx.throw(400, 'Cannot return the book.');
    if(!rental.is_picked && rental.pickup_requested_at === null) {
      var updateParams = {
        "rentals.$.status" : 'SCHEDULED FOR PICKUP',
        "rentals.$.pickup_requested_at" : new Date()
      }

      return db.Booking.findOneAndUpdate({user_id : userId, 'rentals._id' : rentId}, {$set : updateParams},{new : true}).exec()
      .then(function(booking){
        if(booking.status === 'PARTIALLY COMPLETED') booking.status = 'COMPLETED';
        booking.save();
        return 'We will pickup the book as soon as possible';
      });
    }
    else this.throw(400, 'Pickup is already in progress for this book');
  })

  this.body = message;
})
