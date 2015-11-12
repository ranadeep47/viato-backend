var elasticsearch = require('elasticsearch');
var _             = require('lodash');
var client        = new elasticsearch.Client({
    host: 'localhost:9200'
    // ,log: 'trace'
});

var BASIC_FIELDS = require('../db/schemas/Catalogue').BASIC_FIELDS;

exports.suggest = suggest;
exports.search = search;

function suggest(q){
  return client.suggest({
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
    return _.pluck(resp.catalogues[0].options, 'text');
  })
  .catch(function(e){
    return [];
  })
}

function search(q){
  return client.search({
    index : 'viato',
    type  : 'catalogues',
    size  : 20,
    body  : {
      query : {
         match : {
            "_all" : {
               query : q,
               operator : "and"
            }
         }
      }
    }
  })
  .then(function(resp){
    return process(_.pluck(resp.hits.hits, '_source'));
  })
  .catch(function(e){
    console.log(e);
    return [];
  })
}

function process(docs){
  var fields = BASIC_FIELDS.concat(['isbn13']);
  //Sort by popularity
  docs = _.sortBy(docs, function(d){ return d.popularity.ratingsCount });
  docs.reverse();

  //Show english first
  var others = [];
  var english = _.filter(docs, function(doc){
    if(doc.language !== 'English') others.push(doc);
    else return true;
  });
  docs = english.concat(others);

  return docs.map(function(doc){
    var item          = _.pick(doc, fields);
    item.pricing      = doc.pricing.rental[0];
    item.catalogueId  = doc.id;
    item.extraKey     = "VIATO";
    item.extraId      = doc.id;
    return item;
  });
}
