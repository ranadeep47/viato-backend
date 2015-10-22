var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AddressSchema = {
  _id         : {type : Schema.Types.ObjectId, default : new Schema.Types.ObjectId},
  label       : {type : String, default : ''},
  flat        : {type : String, required : true},
  street      : {type : String, required : true},
  locality    : {
    placeId : {type : String, default : ''},
    name : {type : String, default : ''},
    _id : false
  },
  is_default  : {type : Boolean, default : true}
}

module.exports = AddressSchema;
