var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserAnalytics = new Schema({
  user_id       : {type : Schema.Types.ObjectId, ref : 'User'},
  searches      : [{
      search_term : String,
      clickItemId : {type : Schema.Types.ObjectId, ref : 'Catalogue'}
  }],
  clicks        : [{type : Schema.Types.ObjectId, ref : 'Catalogue'}]
});

module.exports = UserAnalytics;
