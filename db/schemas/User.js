var mongoose = require('mongoose');
var is = require('is_js');
var _ = require('lodash');
var Schema = mongoose.Schema;

var AddressSchema   = require('./Address');
var BasicItemSchema = require('./BasicItem');
var CopounSchema    = require('./Copoun');

var Constants   = require('../../constants');
var SchemaUtils = require('../utils');

var UserDeviceSchema = new Schema({
  device_id     : {type : String},  //IMEI / CDMI id
  app_token     : {type : String},
  created_at    : {type : Date, default : new Date},
  updated_at    : {type : Date, default : new Date}
}, SchemaUtils.defaultOptions)

var UserSchemaOptions = _.clone(SchemaUtils.defaultOptions);
UserSchemaOptions.toObject.hide = 'full_name';

var UserSchema = new Schema({
  first_name      : {type : String, default : ''},
  last_name       : {type : String, default : ''},
  access_token    : {type : String},
  mobile          : {type : String, match : /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[789]\d{9}$/, required: true},
  email           : {
    _id                 : false,
    email               : {type : String, validate : {validator : is.email, message : '{VALUE} is not a valid email'}, required : true},
    is_verified         : {type : Boolean, default : false},
    verified_at         : {type : Date, default : null},
    verification_token  : {type : String, required : true}
  },
  social_accounts : {type : [Schema.Types.Mixed], default : []},
  devices         : {type : [UserDeviceSchema], default : []},
  addresses       : {type : [AddressSchema], default : []},
  cart            : {type : [BasicItemSchema], default : []},
  wishlist        : {type : [BasicItemSchema], default : []},
  reads           : {
    _id : false,
    reading : {type : [BasicItemSchema], default : []},
    read : {type : [BasicItemSchema], default : []}
  },
  copouns        : {type : [CopounSchema], default : []}
}, UserSchemaOptions);

module.exports = UserSchema;

UserSchema
  .virtual('full_name')
  .get(function(){
    return this.first_name + ' ' + this.last_name;
  });

UserSchema.statics.addCopoun = function(userId, Copoun){
  return this.findOne({_id : userId}).select('copouns').exec().then(function(User){
    if(!User) return User;
    User.copouns.push(Copoun);
    User.save();
    return _.last(User.copouns);
  });
}

UserSchema.statics.updateCopounApplied = function(userId, copounId){
  return this.findOne({_id : userId, 'copouns._id' : copounId}).select('copouns').exec()
  .then(function(User){
    if(!User) return;
    User.copouns[0]['applied_at'] = new Date();
    User.save();
    return _.first(User.copouns);
  })
}

UserSchema.statics.addToCart = function(userId, basicItem) {
  return this.findOne({_id : userId}).select('cart addresses').exec()
  .then(function(user){
    if(!user) throw new Error('Invalid userId');
    if(user.cart.length > 1) throw new Error('Cannot have more than 2 items in cart');
    user.cart.push(basicItem);
    user.save();
    return {cart : user.cart, addresses : user.addresses}
  })
}

UserSchema.statics.removeFromCart = function(userId, cartInstanceId) {
  return this.update({_id : userId}, {$pull : {cart : {_id : cartInstanceId}}}).exec();
}

UserSchema.statics.emptyCart = function(userId) {
  return this.update({_id : userId}, {$set : {cart : []}}).exec();
}

UserSchema.statics.getAddresses = function(userId) {
  return this.findOne({_id : userId}, 'addresses').exec()
  .then(function(user){
    if(!user) throw new Error('Invalid userId');
    return user.addresses;
  })
}

UserSchema.statics.addAddress = function(userId, address) {
  return this.findOne({_id : userId}).select('addresses').exec().then(function(user){
    user.addresses.forEach(function(a){ a['is_default'] = false;});
    user.addresses.push(address);
    return user.save();
  })
}

UserSchema.statics.removeAddress = function(userId, addressId) {
  var Model = this;
  return this.findOne({_id : userId, "addresses._id" : addressId}, {"addresses.$" : 1}).exec().then(function(user){
    var Address = user.addresses[0];
    if(Address['is_default']){
      Model.findOne({_id : userId}).select('addresses').exec().then(function(user){
        if(!user.addresses.length) return;
        user.addresses[0]['is_default'] = true;
        user.save();
      })
    }

    return Model.update({_id : userId}, {$pull : {addresses : {_id : addressId}}}).exec();
  })
}

UserSchema.statics.updateAddress = function(userId, addressId, address) {
  var fields = {};
  for(var key in address) {
    fields['addresses.$.'+key] = address[key];
  }
  return this.findOneAndUpdate({_id : userId, "addresses._id": addressId}, {$set : fields},{new : true}).exec()
  .then(function(user){
    return _.find(user.addresses, function(a){ return a['_id'].toString() === addressId});
  });
}

UserSchema.statics.getMyBooks = function(userId) {
  var fields = ['wishlist', 'reads'];
  return this.findOne({_id : userId}).select(fields.join(' ')).exec()
  .then(function (user) {
      if(!user) throw new Error('Invalid userId');
      return _.pick(user, fields);
  });
}

UserSchema.statics.addToReading = function(userId, bookingId, basicItem) {
  basicItem.extraId = bookingId;
  var User = this;
  return this.findOne({_id : userId},'reads').exec()
  .then(function(user){
    var catalogueId = basicItem.catalogueId;
    var contains = _.filter(user.reads['reading'], function(r){ return r['catalogueId'] === catalogueId});
    if(contains.length > 0) {
      throw new Error('Book already exists.');
    }
    //If doesnt already exists
    return User.findOneAndUpdate({_id : userId}, {$push : {'reads.reading' : {$each : [basicItem], $position : 0}}},{new : true}).exec()
    .then(function(user){
      return user.reads['reading']
    })
  })
}

UserSchema.statics.addToRead = function(userId, basicItem) {
  var User = this;
  return this.findOne({_id : userId},'reads').exec()
  .then(function(user){
    var catalogueId = basicItem.catalogueId;
    var contains = _.filter(user.reads['read'], function(r){ return r['catalogueId'] === catalogueId});
    if(contains.length > 0) {
      throw new Error('Book already exists');
    }
    //If doesnt exists
    return User.findOneAndUpdate({_id : userId}, {$push : {'reads.read' : {$each : [basicItem], $position : 0}}},{new : true}).exec()
    .then(function(user){
      return _.find(user.reads['read'], function(r) { return r['catalogueId'] === catalogueId});
    });
  })
}

UserSchema.statics.removeFromReading = function(userId, readId) {
  return this.update({_id : userId}, {$pull : {'reads.reading' : {_id : readId}}}).exec();
}

UserSchema.statics.removeFromRead = function(userId, readId) {
  return this.update({_id : userId}, {$pull : {'reads.read' : {_id : readId}}}).exec();
}

UserSchema.statics.addToWishlist = function(userId, basicItem) {
  var User = this;
  return this.findOne({_id : userId},'wishlist').exec()
  .then(function(user){
    var catalogueId = basicItem.catalogueId;
    var contains = _.filter(user.wishlist, function(r){ return r['catalogueId'] === catalogueId });
    if(contains.length > 0) {
      return contains[0];
    }

    //If doesnt exists
    return User.findOneAndUpdate({_id : userId}, {$push : {'wishlist' : {$each : [basicItem], $position : 0}}},{new : true}).exec()
    .then(function(user){
      return _.find(user['wishlist'], function(r) { return r['catalogueId'] === catalogueId });
    })
  })
}

UserSchema.statics.removeFromWishlist = function(userId, wishlistId) {
  return this.update({_id : userId}, {$pull : {'wishlist' : {_id : wishlistId}}}).exec();
}

UserSchema.statics.addAccounts = function(userId, accounts){
  return this.findOne({_id : userId}, 'social_accounts').exec().then(function(user){
    if(!user['social_accounts']) {
      user['social_accounts'] = [];
    }
    user['social_accounts'] = user['social_accounts'].concat(accounts);
    //Remove duplicates by name
    user['social_accounts'] = _.uniq(user['social_accounts'], 'type');
    user.save();
  });
}
