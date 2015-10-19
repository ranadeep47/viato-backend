var fetch = require('./goodreads');

fetch('http://www.goodreads.com/book/show/25916133-aarushi')
.then(function(l){
  console.log(l);
})
.catch(function(e){
  console.log(e);
})
