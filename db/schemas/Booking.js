var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AddressSchema = require('./Address');
var RentalSchema = require('./Rental');
var PaymentSchema = require('./Payment');

var Constants = require('../../constants');
var SchemaUtils = require('../utils');

var BookingSchema = new Schema({
  user_id           : {type : Schema.Types.ObjectId, required : true},
  order_id          : {type : String, required : true},
  status            : {type : String, enum : Constants.enums.BookingStatuses, required : true},
  delivery_address  : AddressSchema,
  pickup_address    : AddressSchema,
  rentals           : {type : [RentalSchema], required : true},
  payment           : PaymentSchema
}, SchemaUtils.defaultOptions);

module.exports = BookingSchema;

//TODO Add for? status 
BookingSchema.path('user_id').index(true);
BookingSchema.path('order_id').index(true);

BookingSchema.statics.getBookingDetail = function(userId, bookingId) {
  return this.findOne({_id : bookingId, user_id : userId}).select('-user_id').then(function(booking){
    booking = booking.toObject();
    delete booking['user_id'];
    return booking;
  });
}

BookingSchema.statics.updateBookingStatus = function(userId, bookingId, status) {
  return this.findOneAndUpdate({_id : bookingId, _id : userId}, {$set : {status : status}}).exec();
}
