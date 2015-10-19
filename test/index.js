var storage = require('node-persist');
var _ = require('lodash');

var arr = storage.getItemSync('more');

var top10 = arr.slice(0, 10);

var fetch = require('../services/amazon');

var pros = top10.map(function(l){ return fetch(l)});

Promise.all(pros).then(function(res){
  var titles = _.pluck(res, 'title');
  console.log(titles);
})

// process.on('exit', function(){
//   storage.setItemSync('more', arr);
// })
