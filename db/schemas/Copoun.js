var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Constants = require('../../constants');

var CopounSchema = {
  number          : {type : Number, required : true},
  type            : {type : String, enum : Constants.enums.CopounTypes, required : true},
  min_amount      : {type : Number, required : true},
  code            : {type : String, required : true},
  expires_at      : {type : Date, required : true},
  applied_at      : {type : Date, default : null},
  use_multiple    : {type : Boolean, default : false}
};

module.exports = CopounSchema;
