var env = process.env['NODE_ENV'];
var config = require('../config')[env];
global.config = config;
var amazonFetch = require('../services/amazon');

amazonFetch("0062273205").then(function(book){
  console.log(book);
})
