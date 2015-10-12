var axios = require('axios');

exports.query = query;
exports.isbn = isbn;

function query(text){
  var url = 'https://www.googleapis.com/books/v1/volumes?q='+text;
  return axios.get(url)
  .then(function(result){
    var data = result.data;
    if(typeof data === 'string') data = JSON.parse(data);
    if(data.totalItems > 0) {
      return data.items.map(parseItem);
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

function parseItem(item){
  var id = item['id'];
  var cover = 'https://books.google.co.in/books/content?id='+id+'&printsec=frontcover&img=1&zoom=1&h=500';
  item = item['volumeInfo'];
  return {
    title       : item['title'] + (':' + item['subtitle'] || ''),
    authors     : item['authors'] || [],
    publisher   : item['publisher'],
    publishDate : new Date(item['publishedDate']),
    releaseDate : new Date(item['publishedDate']),
    description : item['description'],
    isbn10      : item['industryIdentifiers'][0]['identifier'],
    isbn13      : item['industryIdentifiers'][0]['identifier'],
    pages       : parseInt(item['pageCount']),
    rating      : parseFloat(item['averageRating']) || 0,
    cover       : cover,
    images      : [cover],
    thumbs      : [cover],
    source      : "GOOGLE",
    sourceId    : item['id'],
    //Unknown fields
    pricing     : {owning : {mrp : 0}, rental : []},
    binding     : 'Unknown',
    copies      : 0,
    available   : false
  }
}
