exports.getFirstItem = function(val) {
  return val[0] || null
}

exports.setFirstItem = function(val) {
  return [val];
}

exports.defaultOptions = {
  id : false, //Disable the virtual getter `id` which is true by default
  toObject : {
    getters : true,
    transform : function(doc, ret, options){
      delete ret['__v']
      //if schema options has toObject['hide'] = 'a b', removes a and b from JSON
      if (options.hide) {
       options.hide.split(' ').forEach(function (prop) {
         delete ret[prop];
       });
      }
    }
  },
  minimize : false //Will allow empty objects to be inserted
}
