var Router = require('koa-router');
var address = new Router();
var db = require('../db');
var utils = require('../utils');
var _ = require('lodash');

module.exports = address;

address.get('/', function*(){
  var userId = this.state.user['userId'];
  this.body = yield db.User.findOne({_id : userId}).select('addresses').exec()
  .then(function(user){
    return user['addresses'];
  });
})

address.post('/', function*(){
  var userId = this.state.user['userId'];
  if(!utils.checkBody(['flat','street','placeId'], this.request.body)) return this.throw(400);

  var address = {};
  address['flat']     = this.request.body['flat'];
  address['street']   = this.request.body['street'];
  address['label']    = this.request.body['label'] || '';
  address['locality'] = {};
  address['locality']['placeId']  = this.request.body['placeId'];
  address['locality']['name']     = this.request.body['locality'] || '';
  //TODO Validate above fields
  address = yield db.User.addAddress(userId, address)
  .then(function(user){
    return _.last(user.addresses);
  });

  this.body = address;
})

address.put('/:addressId', function*(){
  var userId     = this.state.user['userId'];
  var addressId  = this.params['addressId'];
  if(!utils.checkBody(['flat','street','label'], this.request.body)) return this.throw(400);

  var address = {};
  address['flat']     = this.request.body['flat'];
  address['street']   = this.request.body['street'];
  address['label']    = this.request.body['label'];

  if(this.request.body['placeId']){
    address['locality'] = {};
    address['locality']['placeId']  = this.request.body['placeId'];
    address['locality']['name']     = this.request.body['locality'] || '';
  }
  //TODO Validate above fields
  this.body = yield db.User.updateAddress(userId, addressId, address)
  .then(function(updatedAdress){
    return updatedAdress;
  });

})

address.delete('/:addressId', function*(){
  var userId     = this.state.user['userId'];
  var addressId  = this.params['addressId'];
  if(!addressId) this.throw(400);

  var confirm = yield db.User.removeAddress(userId, addressId);
  if(confirm.ok) this.body = 'Address removed';
  else this.throw(500);
})
