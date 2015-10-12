var amazonFetcher = require('../services/amazon');

amazonFetcher('8185986177')
.then(function(item){
  console.log(item);
})
