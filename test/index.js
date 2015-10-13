// var amazonFetcher = require('../services/amazon');
//
// amazonFetcher('8185986177')
// .then(function(item){
//   console.log(item);
// })


var gbooks = require('../services/gbooks');

// gbooks.isbn('9784873113364')
// .then(function(book){
//   console.log(book);
// })

gbooks.fetch('0bVgCgAAQBAJ')
.then(function(res){
  console.log(res);
})
