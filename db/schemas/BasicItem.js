var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BasicItemSchema = {
  catalogueId   : String,
  title         : String,
  authors       : [String],
  thumbs        : [String],
  cover         : String,
  pricing       : {
    _id         : {type : Schema.Types.ObjectId},
    rent        : Number,
    period      : Number,
    mrp         : {type : Number, default : 0},
    deposit     : {type : Number, default : 0}
  },
  extraKey      : {type : String, default : ''},
  extraId       : {type : String}
}

module.exports = BasicItemSchema;
