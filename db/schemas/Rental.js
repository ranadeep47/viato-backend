var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BasicItemSchema = require('./BasicItem');
var AddressSchema = require('./Address');
var PaymentSchema = require('./Payment');

var SchemaUtils = require('../utils');
var Constants = require('../../constants');

var RentalSchema = new Schema({
  item                : BasicItemSchema,
  expires_at          : {type : Date, required : true},
  status              : {type : String, enum : Constants.enums.RentStatus, required : true},
  is_delivered        : {type : Boolean, default : false},
  expected_delivery_at: {type : Date, default : null},
  delivered_at        : {type : Date, default : null},
  is_picked           : {type : Boolean, default : false},
  pickup_done_at      : {type : Date, default : null},
  pickup_requested_at : {type : Date, default : null},
  is_extended         : {type : Boolean, default : false},
  extended_at         : {type : Date, default : null},
  extension_payment   : {type : PaymentSchema, default : null},
  extension_pricing   : {
    _id         : {type : Schema.Types.ObjectId},
    rent        : Number,
    period      : Number
  },
}, SchemaUtils.defaultOptions);

module.exports = RentalSchema;
