var elasticsearch = require('elasticsearch');
var _             = require('lodash');
var client        = new elasticsearch.Client({
    host: 'localhost:9200'
    // ,log: 'trace'
});

exports.suggest = sugget;
exports.search = search;

function suggest(q){
  client.suggest({
    index: 'viato',
    body: {
      catalogues: {
        text: q,
        completion : {
          field: 'tags_search'
        }
      }
    }
  })
  .then(function(resp){
    _.pluck(resp.catalogues[0].options, 'text');
  })
  .catch(function(e){
    return [];
  })
}

function search(q){
  
}
