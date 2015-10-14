var mongoose = require('mongoose');
var is = require('is_js');
var _ = require('lodash');
var Schema = mongoose.Schema;

var BasicItemSchema = require('./BasicItem');

var Constants = require('../../constants');
var SchemaUtils = require('../utils');

var FeedSchema = new Schema({
  title : String,
  image : String,
  list  : [BasicItemSchema]
}, SchemaUtils.defaultOptions);

module.exports = FeedSchema;
