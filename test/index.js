var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200'
  // ,log: 'trace'
});

client.search({
  index : 'viato',
  type  : 'catalogues',
  size  : 20,
  body  : {
    query : {
       match : {
          "_all" : {
             query : "wings abdul",
             operator : "and"
          }
       }
    }
  }
})
.then(function(resp){
  console.log(resp);
})
