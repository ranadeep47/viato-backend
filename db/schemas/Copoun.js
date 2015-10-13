var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CopounSchema = new Schema({
  code            : {type : String, required : true},
  expires_at      : {type : Date, default : Date.now},
  applies_to      : {type : [{type : Schema.Types.ObjectId, ref : 'User'}], default : []},
  applies_to_all  : {type : Boolean, default : false}
});

module.exports = CopounSchema;
