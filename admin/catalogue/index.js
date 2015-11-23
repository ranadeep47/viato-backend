var db = require('../../db');
var Router = require('koa-router');
var catalogue = new Router();
var _ = require('lodash');
var moment = require('moment');

module.exports = catalogue;

catalogue.get(':id', function*(){
  var id = this.params['id'];
  var Book = yield db.Catalogue
  .findOne({_id : id})
  .select('pricing title thumbs authors')
  .exec();
  yield this.render('book-detail', Book)
});

catalogue.post(':id/rent', function*(){
  var id = this.params['id'];
  var rent = this.request.body['rent'];
  var Book = yield db.Catalogue
  .findOne({_id : id})
  .select('pricing')
  .exec();

  Book['pricing']['rental'][0].rent = parseInt(rent);
  Book.save();

  var ctx = this;
  var rentalId = Book['pricing']['rental'][0]._id;

  yield db.feeds
  .update(
    {'list.pricing._id' : rentalId },
    {$set : {'list.$.pricing.rent' : 50}} ,
    {multi : true}
  )
  .exec()
  .then(function(){
    ctx.body = 'Price Updated';
  })


})

catalogue.post(':id/edition', function*(){
  var id = this.params['id'];
  var isbn = this.request.body['isbn'];
  var Book = yield db.Catalogue
  .findOne({_id : id})
  .select('isbn13')
  .exec();

  Book['isbn13'].push(isbn);
  var ctx = this;

  yield Book.save().then(function(){
    ctx.body = 'Edition Added'
  });

})
