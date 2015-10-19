var fetch = require('./goodreads');



var isbn = [
  '9780765328342', '9780330391566',
  '9780099416159', '9781567922813',
  '9780330525602', '9780755354061',
  '9780425212783', '9788192877440',
  '9780099282648', '9780330419024'
];



var links = isbn.map(function(i){ return "http://www.goodreads.com/search?utf8=%E2%9C%93&query="+i});

var pros = links.map(function(l){ return fetch(l)});

console.time('start')
Promise.all(pros).then(function(r){
  console.timeEnd('start');
  console.log(r);
})
.catch(log)

function log(e){
  console.log(e);
}
