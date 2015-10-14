var mongoose = require('mongoose');
var is = require('is_js');
var _ = require('lodash');
var Schema = mongoose.Schema;

var BasicItemSchema = require('./BasicItem');

var Constants = require('../../constants');
var SchemaUtils = require('../utils');

var AdminSchema = new Schema({
  email      : {type : String, validate : {validator : is.email, message : '{VALUE} is not a valid email'}, required : true},
  mobile     : {type : String, match : /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[789]\d{9}$/, required: true},
  access     : {
    content : {type : Boolean, required : true},
    booking : {type : Boolean, required : true}
  },
  password   : {type : String, required : true, minlength : 5}
}, SchemaUtils.defaultOptions);

module.exports = AdminSchema;
