var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BasicItemSchema = {
  catalogueId   : {type : Schema.Types.ObjectId, ref : 'Catalogue'},
  title         : String,
  authors       : [String],
  thumbs        : [String],
  cover         : String,
  pricing       : {
    _id         : {type : Schema.Types.ObjectId},
    rent        : Number,
    period      : Number
  },
  extraKey      : {type : String, default : ''},
  extraId       : {type : Schema.Types.ObjectId}
}

module.exports = BasicItemSchema;
