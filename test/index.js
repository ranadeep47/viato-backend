var amazonFetch = require('../services/amazon');

amazonFetch("0062273205").then(function(book){
  console.log(book);
})
