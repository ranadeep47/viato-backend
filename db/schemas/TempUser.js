var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SchemaUtils = require('../utils');

var TempUserSchema = new Schema({
  mobile          : {type : String, match : /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[789]\d{9}$/, required: true},
  otp             : {type : String, required : true},
  created_at      : {type : Date, default : Date.now},
  otp_generated_at: {type : Date},
  otp_verified_at : {type : Date, default : null},
  is_otp_verified : {type : Boolean, default : false},
  imei            : {type : String, required : true}
}, SchemaUtils.defaultOptions);

//Path

//Pre

//Statics and methods

TempUserSchema.methods = {}
TempUserSchema.statics = {};

module.exports = TempUserSchema;
