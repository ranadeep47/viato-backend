var db = require('../db');
var storage = require('node-persist');
var request = require('request');
var cheerio = require('cheerio');


storage.initSync({
  dir : __dirname + '/persist'
});
var offset = storage.getItemSync('offset');

fetch();

function fetch(){
  db.Catalogue.find()
  .select('isbn13').sort({'popularity.ratingsCount' : {$gt : 999}}).skip(offset).limit(10)
  .exec().then(function(docs){
    if(!docs) {
      process.exit();
      return;
    }

    var promises = docs.map(function(doc){
      return get(doc.isbn13);
    })

    Promise.all(promises).then(function(results){
      return console.log(results);
      var pros = results.map(function(el, i){
        return update(docs[i], el);
      });

      Promise.all(pros).then(function(){
        offset += 10;
        storage.setItemSync('offset', offset);
        fetch();
      })
    })
  })
}

function update(doc, popularity){
  if(popularity.rating === 0 &&
    popularity.reviewsCount === 0 &&
    popularity.ratingsCount === 0) {
      return new Promise(function(resolve){
        resolve(true);
      })
  }

  return db.Catalogue.update({_id : doc._id}, {$set : {popularity : popularity}}).exec();
  //Skips update if all three are zero;
}

function get(isbn13){
  var url = "http://www.goodreads.com/search?query="+isbn13;
  return new Promise(function(resolve, reject) {
    request.get(url,function(e,r,d){
      var $ = cheerio.load(d);
      var rating       = parseFloat($('.average').text())
      var ratingsCount = parseInt($('.votes').text().replace(/,/g,''));
      var reviewCount  = parseInt($('.count').text().replace(/,/g,''));

      if(isNaN(rating)) rating = 0;
      if(isNaN(ratingsCount)) ratingsCount = 0;
      if(isNaN(reviewCount)) reviewCount = 0;

      if(rating === 0 && ratingsCount === 0 && reviewCount === 0){
        throw new Error('Cant believe this data');
      }

      resolve({
        rating : rating,
        ratingsCount : ratingsCount,
        reviewsCount : reviewCount,
      });

    });
  });
}
