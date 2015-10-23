var request = require('request');
var cheerio = require('cheerio');

module.exports = fetch;

function fetch(amazonId) {
  return new Promise(function(resolve, reject) {
    var url = "http://www.amazon.in/dp/"+amazonId;
    request.get(url,function(e,r,d){
      if(e) return reject(e);
       var $ = cheerio.load(d);
       var rating       = parseFloat($('#avgRating').text().replace('out of 5 stars', '')) || 0;
       var ratingsCount = parseInt($('#acrCustomerReviewText').text()) || 0;
       var description  = $('#bookDescription_feature_div noscript').html() || '';

       if(isNaN(rating)) rating = 0;
       if(isNaN(ratingsCount)) ratingsCount = 0;

       var reviewCount = ratingsCount;

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
