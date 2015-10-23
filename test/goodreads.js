var request = require('request');
var cheerio = require('cheerio');

module.exports = fetch;

function fetch(url) {
  return new Promise(function(resolve, reject) {
    request.get(url,function(e,r,d){
      if(e) return reject(e);
       var $ = cheerio.load(d);
       var rating       = parseFloat($('.average').text())
       var ratingsCount = parseInt($('.votes').text());
       var reviewCount  = parseInt($('.count').text());
       var description  = $('#description span~span').html() || '';

       if(description === '') {
         description = $('#description span').html() || '';
       }

       if(isNaN(rating)) rating = 0;
       if(isNaN(ratingsCount)) ratingsCount = 0;
       if(isNaN(reviewCount)) reviewCount = 0;

       var doc = {
         popularity : {
           rating : rating,
           ratingsCount : ratingsCount,
           reviewsCount : reviewCount,
         },
         description : description
       }
      resolve(doc);
    })
  });
}
