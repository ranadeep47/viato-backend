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
  extraId   : {type : Schema.Types.ObjectId}
}

module.exports = BasicItemSchema;
