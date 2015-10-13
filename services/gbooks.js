var axios = require('axios');
var _ = require('lodash');
var isbnUtils = require('isbn-utils');

exports.query = query;
exports.isbn = isbn;
exports.fetch = fetch;

function query(text){
  var url = 'https://www.googleapis.com/books/v1/volumes?q='+text;
  return axios.get(url)
  .then(function(result){
    var data = result.data;
    if(typeof data === 'string') data = JSON.parse(data);
    if(data.totalItems > 0) {
      var items = [];
      for(var i=0; i<items.length; ++i) {
        var item = parseItem(data['items'][i]);
        if(item) items.push(item);
      }
    }
    else return null;
  })
  .catch(function(e){
    console.log(e);
    return null;
  })
}

function isbn(isbn13){
  var url = 'https://www.googleapis.com/books/v1/volumes?q=isbn:'+isbn13;
  return axios.get(url)
  .then(function(result){
    var data = result.data;
    if(typeof data === 'string') data = JSON.parse(data);
    if(data.totalItems > 0) {
      var item = data.items[0];
      item = parseItem(item);
      return item;
    }
    else return null;
  })
  .catch(function(e){
    console.log(e);
    return null;
  })
}

function fetch(volumeId){
  var url = 'https://www.googleapis.com/books/v1/volumes/'+volumeId;
  return axios.get(url)
  .then(function (result) {
    var data = result.data;
    if(typeof data === 'string') data = JSON.parse(data);
    var item = parseItem(data);
    return item;
  })
  .catch(function(e){
    console.log(e);
    return null;
  })
}

function parseItem(item){
  var id = item['id'];
  var imageLink = 'https://books.google.co.in/books/content?id='+id+'&printsec=frontcover&img=1&zoom=1';
  var cover = imageLink+'&h=500';
  item = item['volumeInfo'];

  if(!('industryIdentifiers' in item)) return null;
  var subtitle = ''
  if(item['subtitle']) subtitle += (':'+item['subtitle']);

  var isbn10 = _.find(item['industryIdentifiers'], {type: "ISBN_10"});
  if(isbn10 && 'identifier' in isbn10) isbn10 = isbn10['identifier'];

  var isbn13 = _.find(item['industryIdentifiers'], {type: "ISBN_13"});
  if(isbn13 && 'identifier' in isbn13) isbn13 = isbn13['identifier'];
  else isbn13 = isbnUtils.parse(isbn10).asIsbn13();

  return {
    title       : item['title'] + subtitle,
    authors     : item['authors'] || [],
    publisher   : item['publisher'],
    publishDate : new Date(item['publishedDate']),
    releaseDate : new Date(item['publishedDate']),
    description : item['description'],
    isbn10      : isbn10,
    isbn13      : isbn13,
    pages       : parseInt(item['pageCount']),
    rating      : parseFloat(item['averageRating']) || 0,
    cover       : cover,
    images      : [cover],
    thumbs      : [imageLink+'&h=150'],
    source      : "GOOGLE",
    sourceId    : id,
    //Unknown fields
    pricing     : {owning : {mrp : 0}, rental : [{rent : 0, period : 0}]},
    binding     : 'Unknown',
    copies      : 0,
    available   : false
  }
}
