var mongoose = require('mongoose');
var is = require('is_js');
var _ = require('lodash');
var Schema = mongoose.Schema;

var BasicItemSchema = require('./BasicItem');
var Constants = require('../../constants');
var SchemaUtils = require('../utils');

var FeedSchema = new Schema({
  title : {type : String, required : true},
  images : {
    cover   : {type : String, required : true},
    square  : {type : String, required : true}
  },
  list  : [BasicItemSchema]
}, SchemaUtils.defaultOptions);

module.exports = FeedSchema;
