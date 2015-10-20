var fetch = require('./goodreads');
var db = require('../db');
var storage = require('node-persist');
storage.initSync({
  dir : __dirname + '/persist'
});

var offset = storage.getItemSync('offset');

get()

function get(){
  return db.Catalogue.find({}).select('isbn13').sort({_id : 1}).skip(offset).limit(10).exec().then(function(docs){
    var links = docs.map(function(i){ return "http://www.goodreads.com/search?utf8=%E2%9C%93&query="+i.isbn13});
    var promises = links.map(function(l){ return fetch(l)});
    return Promise.all(promises).then(function(results){
      var pros = [];
      var result, doc;
      for(var i =0; i < results.length; ++i ) {
        result = results[i];
        doc = docs[i];
        pros.push(update(result, doc._id));
      }
      return Promise.all(pros).then(function(){
        console.log('Completed : ', offset);
        offset += 10;
        storage.setItemSync('offset', offset);
        get();
      })
    })
  })
}

function update(result, id){
  return db.Catalogue.update({_id : id}, {$set : {popularity : result.popularity, description : result.description}}).exec();
}
