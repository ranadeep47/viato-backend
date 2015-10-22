var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = require('mongoose').Types.ObjectId;

var Constants = require('../../constants');

var PaymentSchema = {
  _id               : {type : Schema.Types.ObjectId, default : new ObjectId},
  payment_mode      : {type : String, enum : Constants.enums.PaymentModes, required : true},
  paid_at           : {type : Date, default : null},
  is_paid           : {type : Boolean, default : false},
  total_payable     : {type : Number, required : true, min : 0},
  total             : {type : Number, default : 0, min : 0},
  tax               : {type : Number, default : 0, min : 0},
  other_charges     : {type : Number, default : 0, min : 0},
  discount          : {type : Number, default : 0, min : 0},
  copoun_discount   : {type : Number, default : 0, min : 0},
  copoun_applied    : {type : Schema.Types.ObjectId, ref : 'Copoun', default : null}
}

module.exports = PaymentSchema;
