var _ = require('lodash');

exports.checkBody = function(arr, obj){
  return arr.reduce(function(exists, v){
    return exists && (v in obj);
  },true);
}

exports.newOTP = function(){
  return 1000 + Math.round(Math.random() * 9000)
}

exports.emailToken = function() {
  return Math.random().toString(32).slice(2);
}
