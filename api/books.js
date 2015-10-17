var Router = require('koa-router');
var books = new Router();
var db = require('../db');
var utils = require('../utils');

var gbooks = require('../services/gbooks');
module.exports = books;


books.get('/:bookId', function*(){
    var catalogueId = this.params['bookId'];
    if(!catalogueId) return this.throw(400);
    var res;
    if(catalogueId.length === 24) res = yield db.Catalogue.getBookDetail(catalogueId);
    else res = yield gbooks.fetch(bookId)

    if(!res) return this.throw(500);
    return this.body = res;
});

books.post('/:bookId/review', function*() {
  var userId = this.state.user['userId'];
  var bookId = this.params['bookId'];

  if(!utils.checkBody(['review','rating'], this.request.body)) return this.throw(400);
  if(!bookId) return this.throw(400);

  var rating = this.request.body['rating'];
  var review = this.request.body['review'];

  var confirm = yield db.Catalogue.addReview(userId, bookId, rating, review);
  //TODO
});
