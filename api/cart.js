var Router = require('koa-router');
var cart = new Router();
var db = require('../db');
var utils = require('../utils');
var _ = require('lodash');

module.exports = cart;

cart.get('/', function*(){
  var userId = this.state.user['userId'];
  var fields = ['cart', 'addresses'];
  var doc = yield db.User.findOne({_id : userId}).select(fields.join(' ')).exec()
  .then(function(user){
    return _.pick(user, fields);
  })

  this.body = doc;
})

cart.post('/', function*(){
  var userId = this.state.user['userId'];

  if(!utils.checkBody(['rentalId', 'catalogueId'], this.request.body)) {
    this.throw(400, 'Invalid request parameters');
  }
  var rentalId = this.request.body['rentalId'];
  var catalogueId = this.request.body['catalogueId'];

  if((rentalId.length !== 24 || catalogueId.length !== 24)){
    this.throw(400);
  }

  var cart = yield db.Catalogue.getItemForCart(catalogueId, rentalId)
  .then(function(basicItem){
    return db.User.addToCart(userId, basicItem)
    .then(function(cart){
      return cart;
    })
  });

  this.body = cart;
});

cart.delete('/:cartItemId', function*(){
  var userId = this.state.user['userId'];
  var cartItemId = this.params['cartItemId'];
  if(!cartItemId || cartItemId.length !== 24) return this.throw(400);

  var confirm = yield db.User.removeFromCart(userId, cartItemId);
  if(confirm.ok) this.body = 'Removed from cart';
});
