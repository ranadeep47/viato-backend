var _ = require('lodash');

exports.checkBody = function(arr, obj){
  return arr.reduce(function(exists, v){
    return exists && (v in obj);
  },true);
}

exports.newOTP = function(){
  return 1000 + Math.round(Math.random() * 9000)
}

exports.emailToken = function() {
  return Math.random().toString(32).slice(2);
}

exports.normaliseGoogleBook = function(item) {
  var googleId = item['id'];
  return {
    googleId      : item['id'],
    title         : item['volumeInfo']['title'],
    subtitle      : item['volumeInfo']['subtitle'],
    authors       : item['volumeInfo']['authors'],
    publisher     : item['publisher'],
    pricing       : null,
    releaseDate   : publishDate,
    publishDate   : item['publishedDate'] ? new Date(item['publishedDate']) : null,
    language      : 'Unknown',
    binding       : 'Unknown',
    dimensions    : 'Unknown',
    description   : item['description'],
    isbn10        : _.find(item['industryIdentifiers'], {type : 'ISBN_10'}).indentifier,
    isbn13        : _.find(item['industryIdentifiers'], {type : 'ISBN_13'})indentifier,
    pages         : item['pageCount'] || 0,
    rating        : item['averageRating'] || 0
    reviewCount   : item['ratingsCount'] || 0,
    cover         : 'https://books.google.co.in/books/content?id='+googleId+'&printsec=frontcover&img=3&zoom=1&h=800',
    images        : [cover]
  }
}
