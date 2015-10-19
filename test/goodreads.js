var axios = require('axios');
var cheerio = require('cheerio');

module.exports = fetch;

function fetch(url) {
  return axios.get(url).then(function(res){
     var $ = cheerio.load(res.data);
     var vals = {
       rating : parseFloat($('.average').text()),
       ratingsCount : parseInt($('.votes').text()),
       reviewCount : parseInt($('.count').text())
     }
    return vals;
  })
}
