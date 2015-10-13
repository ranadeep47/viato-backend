var db = require('../db');

db.Catalogue.findOne()
.then(function(cat){
  console.log(cat);
})
.catch(function(e){
  console.log(e);
})
