var Router = require('koa-router');
var mybooks = new Router();
var db = require('../db');
var utils = require('../utils');

var GBooks = require('../services/gbooks');

module.exports = mybooks;

mybooks.get('/', function*(){
  var userId = this.state.user['userId'];
  this.body = yield db.User.getMyBooks(userId);
});

mybooks.get('/home', function*() {
  var quotes = [
    {
      cover   : "https://unsplash.it/1080/600?random",
      quote   : "Keep love in your heart. A life without it is like a sunless garden when the flowers are dead.",
      quoter  : "Oscar Wilde",
    },

    {
      cover   : "https://unsplash.it/1080/600?random",
      quote   : "We love life, not because we are used to living but because we are used to loving.",
      quoter  : "Friedrich Nietzsche"
    }
  ]

  this.body = quotes;
})

mybooks.get('/read', function*(){
  var userId = this.state.user['userId'];
  this.body = (yield db.User.getMyBooks(userId))['reads']
});

mybooks.post('/read', function*(){
  var userId = this.state.user['userId'];
  if(!utils.checkBody(['catalogueId'], this.request.body)) return this.throw(400);
  var catalogueId = this.request.body['catalogueId'];

  if(catalogueId.length === 24) {
    this.body = yield db.Catalogue.getBasicItem(catalogueId).then(function(basicItem){
      return db.User.addToRead(userId, basicItem);
    });
  }
  else {
    this.body = yield GBooks.fetch(catalogueId).then(function(book){
      if(!book) return this.throw(500,'Error adding book to your read list');
      var basicItem = GBooks.getBasicItem(book);
      return db.User.addToRead(userId, basicItem);
    })
  }

});

mybooks.delete('/read/:readId', function*(){
  var userId = this.state.user['userId'];
  var readId = this.params['readId']
  if(!readId || readId.length !== 24) return this.throw(400);
  var confirm = yield db.User.removeFromRead(userId, readId);
  if(confirm.ok) this.body = 'Removed from read list';
  else this.throw(500);
});

mybooks.get('/wishlist', function*(){
  var userId = this.state.user['userId'];
  this.body = (yield db.User.getMyBooks(userId))['wishlist'];
});

mybooks.get('/wishlist/status/:bookId', function*(){
  var userId      = this.state.user['userId'];
  var catalogueId = this.params['bookId'];

  if(!catalogueId) return this.throw(400);
  var User = yield db.User
  .findOne({_id : userId, 'wishlist.catalogueId' : catalogueId})
  .select('wishlist')
  .exec();

  this.body = User ? User.wishlist[0]._id.toString() : "";
})

mybooks.post('/wishlist', function*(){
  var userId = this.state.user['userId'];
  if(!utils.checkBody(['catalogueId'], this.request.body)) return this.throw(400);
  var catalogueId = this.request.body['catalogueId'];

  if(catalogueId.length === 24) {
    this.body = yield db.Catalogue.getBasicItem(catalogueId).then(function(basicItem){
      return db.User.addToWishlist(userId, basicItem);
    });
  }
  else {
    this.body = yield GBooks.fetch(catalogueId).then(function(book){
      if(!book) return this.throw(400,'Error adding book to your read list');
      var basicItem = GBooks.getBasicItem(book);
      return db.User.addToWishlist(userId, basicItem);
    })
  }
})

mybooks.delete('/wishlist/:wishlistId', function*(){
  var userId = this.state.user['userId'];
  var wishlistId = this.params['wishlistId'];
  if(!wishlistId || wishlistId.length !== 24) return this.throw(400);
  var confirm = yield db.User.removeFromWishlist(userId, wishlistId);
  if(confirm.ok) this.body = 'Removed from wish list';
  else this.throw(500);
})
