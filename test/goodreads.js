var request = require('request');
var cheerio = require('cheerio');

module.exports = fetch;

function fetch(url) {
  return new Promise(function(resolve, reject) {
    request.get(url,function(e,r,d){
      if(e) return reject(e);
       var $ = cheerio.load(d);
       var vals = {
         rating : parseFloat($('.average').text()),
         ratingsCount : parseInt($('.votes').text()),
         reviewCount : parseInt($('.count').text())
       }
      resolve(vals);
    })
  });
}
