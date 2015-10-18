var axios = require('axios');
var Router = require('koa-router');
var search = new Router();
var db = require('../db');

var _ = require('lodash');
var isbn = require('isbn-utils');

var gbooks = require('../services/gbooks');

module.exports = search;

search.get('/', function*(){
  var query = this.query['q']
  if(!query) return this.throw('Invalid search query parameter');
  query = query.trim();

  var maybeISBN = isbn.parse(query);
  if(maybeISBN && (maybeISBN.isIsbn10() || maybeISBN.isIsbn13())) {
    return this.body = yield handleISBNSearch(maybeISBN.asIsbn13());
  }
  this.body = yield handleTextSearch(query);
});

function handleTextSearch(query){
  return Promise.all([catalogueTextSearch(query), googleTextSearch(query)])
  .then(function(results){
    var catalogue = results[0] || [];
    var google = results[1] || [];
    var catalogueISBN = _.pluck(catalogue, 'isbn13');
    //Return the google results which are not in catalogue
    var googleResults = _.filter(google, function(g) {return catalogueISBN.indexOf(g['isbn13']) === -1});
    //Try to fetch and place them in our catalogue from amazon
    return catalogue.concat(googleResults);
  });
}

function handleISBNSearch(isbn){
  //Search from google books and catalogue in paralell
  return Promise.all([catalogueISBNSearch(isbn), googleISBNSearch(isbn)])
  .then(function(catalogue){
    if(catalogue[0]) return [catalogue[0]];
    else if (catalogue[1]) return [catalogue[1]];
    //Damn where did you get that ISBN !
    return []
  })
}

function catalogueTextSearch(query) {
    //Check if its a phrase
    query = query.split(' ').length > 1 ? '\"'+query+'\"' : query;
    return db.Catalogue.search(query);
}

function catalogueISBNSearch(isbn13){
  return db.Catalogue.findOne({isbn13 : isbn13}).exec().then(function(catItem){
    if(!catItem) return null;
    return db.Catalogue.getBasicItem(catItem._id, ['isbn13']);
  });
}

function googleTextSearch(query) {
  return gbooks.query(query).then(function(books){
    if(!books) return null;
    return books.map(function(book){
      return processGoogleItem(book);
    });
  });
}

function googleISBNSearch(isbn) {
  return gbooks.isbn(isbn).then(function(book){
    if(!book) return book;
    return processGoogleItem(book);
  });
}

function processGoogleItem(book) {
    var BASIC_FIELDS = ['title','cover','authors','pricing','thumbs','isbn13'] // Search needs isbn13 too
    var item          = _.pick(book, BASIC_FIELDS);
    item.pricing      = book.pricing.rental[0];
    item.catalogueId  = book['sourceId'];
    item.extraKey     = "GOOGLE";
    item.extraId      = book['sourceId'];
    item.isbn13       = book['isbn13'];
    return item;
}
