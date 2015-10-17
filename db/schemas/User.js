var mongoose = require('mongoose');
var is = require('is_js');
var _ = require('lodash');
var Schema = mongoose.Schema;

var AddressSchema = require('./Address');
var BasicItemSchema = require('./BasicItem');

var Constants = require('../../constants');
var SchemaUtils = require('../utils');

var UserDeviceSchema = new Schema({
  device_id     : {type : String},
  platform      : {type : String, enum : Constants.enums.DevicePlatforms},
  dimensions    : {type : Schema.Types.Mixed},
  model         : String
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
  }
}, UserSchemaOptions);

module.exports = UserSchema;

UserSchema
  .virtual('full_name')
  .get(function(){
    return this.first_name + ' ' + this.last_name;
  });


UserSchema.statics.addToCart = function(userId, basicItem) {
  return this.findOne({_id : userId}).exec()
  .then(function(user){
    if(!user) throw new Error('Invalid userId');
    if(user.cart.length > 1) throw new Error('Cannot have more than 2 items in cart');
    user.cart.push(basicItem);
    user.save();
    return user.cart;
  })
}

UserSchema.statics.removeFromCart = function(userId, cartInstanceId) {
  return this.update({_id : userId}, {$pull : {cart : {_id : cartInstanceId}}}).exec();
}

UserSchema.statics.emptyCart = function(userId) {
  return this.update({_id : userId}, {$set : {cart : []}}).exec();
}

UserSchema.statics.getCart = function(userId) {
  return this.findOne({_id : userId},'cart').exec()
  .then(function(user){
    if(!user) throw new Error('Invalid userId');
    return user.cart;
  })
}

UserSchema.statics.getAddresses = function(userId) {
  return this.findOne({_id : userId}, 'addresses').exec()
  .then(function(user){
    if(!user) throw new Error('Invalid userId');
    return user.addresses;
  })
}

UserSchema.statics.addAddress = function(userId, address) {
  return this.findOneAndUpdate({_id : userId}, {$push : {addresses : address}}, {new : true}).exec();
}

UserSchema.statics.removeAddress = function(userId, addressId) {
  return this.update({_id : userId}, {$pull : {addresses : {_id : addressId}}}).exec();
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
    var contains = _.filter(user.reads['reading'], function(r){ return r['catalogueId'].equals(catalogueId)});
    if(contains.length > 0) {
      throw new Error('Book already exists.');
    }
    //If doesnt already exists
    return User.findOneAndUpdate({_id : userId}, {$push : {'reads.reading' : basicItem}},{new : true}).exec()
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
    var contains = _.filter(user.reads['read'], function(r){ return r['catalogueId'].equals(catalogueId)});
    if(contains.length > 0) {
      throw new Error('Book already exists');
    }
    //If doesnt exists
    return User.findOneAndUpdate({_id : userId}, {$push : {'reads.read' : basicItem}},{new : true}).exec()
    .then(function(user){
      return _.find(user['reads.read'], function(r) { return r['catalogueId'].equals(catalogueId)});
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
    var contains = _.filter(user.wishlist, function(r){ return r['catalogueId'].equals(catalogueId)});
    if(contains.length > 0) {
      throw new Error('Book already exists');
    }

    //If doesnt exists
    return User.findOneAndUpdate({_id : userId}, {$push : {'wishlist' : basicItem}},{new : true}).exec()
    .then(function(user){
      return _.find(user['wishlist'], function(r) { return r['catalogueId'].equals(catalogueId)});
    })
  })
}

UserSchema.statics.removeFromWishlist = function(userId, wishlistId) {
  return this.update({_id : userId}, {$pull : {'wishlist' : {_id : wishlistId}}}).exec();
}
