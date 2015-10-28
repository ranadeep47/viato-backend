var Router = require('koa-router');
var bookings = new Router();
var db = require('../db');
var utils = require('../utils');
var moment = require('moment');
var _ = require('lodash');

module.exports = bookings;

bookings.get('/', function*(){
  var userId = this.state.user['userId'];
  this.body = yield db.Booking.find({user_id : userId}).select('-user_id').sort({booked_at : -1}).exec()
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
//TODO  var copounCode = this.request.body['copounId'];

  var fields = ['cart', 'addresses'];
  this.body = yield db.User.findOne({_id : userId}).select(fields.join(' ')).exec()
  .then(function(user){
    if(!user) throw new Error('Invalid userId');
    var address = _.find(user.addresses, function(a){ return a['_id'].toString() === addressId});
    if(!address) throw new Error('Invalid addressId');
    //Got a valid address, create booking from the cart
    var cart = user.cart;
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
          expires_at : moment().add(rentalItem.pricing.period, 'days').toDate(),
          status : 'YET TO DELIVER'
        }
      });

      var total_payable = cart.reduce(function(total,item){
        return total += item.pricing.rent;
      }, 0);

      var payment = {
        payment_mode : 'COD',
        total_payable : total_payable
      }

      var booking = {
        user_id : userId,
        order_id : Math.random().toString(32).slice(4),
        status  : 'PLACED',
        delivery_address : address,
        pickup_address : address,
        rentals : rentals,
        booking_payment : payment
      };

      db.Booking.create(booking);
      //Empty cart
      db.User.emptyCart(userId);
      return booking['order_id'];
    })
  })
})

bookings.post('/rents/extend', function*(){
  var userId = this.state.user['userId'];
  var rentId = this.request.body['rentId'];
  if(!rentId || rentId.length !== 24) {
    return this.throw(400);
  }

  var message = yield db.Booking.findOne({user_id : userId, 'rentals._id' : rentId},{"rentals.$" : 1}).exec()
  .then(function(booking){
    var rental = booking.rentals[0];
    if(!rental.is_picked && !rental.is_extended) {
      var period = rental.item.pricing.period;
      var extension_cost = rental.item.pricing.rent - 20;
      //Extend
      var extension_payment = {
        payment_mode : 'COD',
        total_payable : extension_cost
      }

      var updateParams = {
        "rentals.$.status" : 'READING-EXTENDED',
        "rentals.$.expires_at"  : moment(rental.expires_at).add(period, 'days').toDate(),
        "rentals.$.is_extended" : true,
        "rentals.$.extended_at" : new Date(),
        "rentals.$.extension_payment" : extension_payment
      }

      return db.Booking.findOneAndUpdate({user_id : userId, 'rentals._id' : rentId}, {$set : updateParams},{new : true}).exec()
      .then(function(booking){
        return {
          status : updateParams["rentals.$.status"],
          expires_at : updateParams["rentals.$.expires_at"],
          message : 'Rental extended for '+period+' more days.'
        }
      })
    }
    else return {message : 'Sorry you have already extended the rental tenure'}
  })

  this.body = message;

})

bookings.post('/rents/return', function*(){
  var userId = this.state.user['userId'];
  var rentId = this.request.body['rentId'];
  if(!rentId || rentId.length !== 24) {
    return this.throw(400);
  }

  var message = yield db.Booking.findOne({user_id : userId, 'rentals._id' : rentId},{"rentals.$" : 1}).exec()
  .then(function(booking){
    var rental = booking.rentals[0];
    if(!rental.is_picked) {
      var updateParams = {
        "rentals.$.status" : 'SCHEDULED FOR PICKUP',
        "rentals.$.pickup_requested_at" : new Date()
      }

      return db.Booking.findOneAndUpdate({user_id : userId, 'rentals._id' : rentId}, {$set : updateParams},{new : true}).exec()
      .then(function(booking){
        return {
          status : updateParams["rentals.$.status"],
          message : 'We will pickup the book as soon as possible'
        }
      });
    }
    else return {message : 'This book has already been collected'}
  })

  this.body = message;
})
