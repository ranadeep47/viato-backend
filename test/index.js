var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

client.suggest({
  index: 'viato',
  body: {
    catalogues: {
      text: 'che',
      completion : {
        field: 'tags_search'
      }
    }
  }
})
.then(function(resp){
  console.log(resp);
})
