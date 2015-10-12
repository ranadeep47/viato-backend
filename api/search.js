var axios = require('axios');
var Router = require('koa-router');
var search = new Router();
var db = require('../db');

var _ = require('lodash');
var isbn = require('isbn-utils');

module.exports = search;

search.get('/', function*(){
  var query = this.query['q'];
  if(!query) return this.throw('Invalid search query parameter');
  var maybeISBN = isbn.parse(query);
  if(maybeISBN.isIsbn10() || maybeISBN.isIsbn13()) {
    return this.body = handleISBNSearch(maybeISBN.asIsbn13());
  }
  this.body = handleTextSearch(query);
});

function handleTextSearch(query){

}

function handleISBNSearch(isbn){
  //Search from google books and catalogue in paralell
}

function googleISBNSearch(isbn) {
  var url = "https://www.googleapis.com/books/v1/volumes?q=isbn:"+isbn;
  return axios.get(url).then(function(res){
    
  })
  .catch(function(e){
    console.log(e);//TODO
    return {}
  })
}
