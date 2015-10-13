var db = require('../db')
var axios = require('axios');
var _ = require('lodash');
var store = require('./store');

var offset = 0

fetch();

function fetch(){
  db.Catalogue.find().select('sourceId').sort({_id : 1}).skip(offset).limit(5).exec()
  then(function(docs){
    if(!docs.length) process.exit();
    var ids = _.pluck(docs, 'sourceId');
    var promises = ids.map(getLinks);
    return Promise.all(promises)
    .then(function(linksArray){
      var promises = linksArray.map(storeLinks);
      return Promise.all(promises)
      .then(function(arrayOfImages){
        var promises = arrayOfImages.map(function(arr, i){
          var images = _.pluck(arr, 'cover');
          images = images.map(function(i){ return "http://viato.in/img/covers/"+ i});
          var thumbs = _.pluck(arr, 'thumb');
          thumbs = thumbs.map(function(t){ return "http://viato.in/img/thumbs/"+ t});
          var cover = images[0];
          var obj = {cover : cover, images, thumbs}
          return updateDB(ids[i], obj);
        })

        return Promise.all(promises)
        .then(function(){
          offset += 10;
          fetch();
        })
        .catch(function(e){
          console.log(e);
          console.log(offset + 10);
        })
      })
    })
  })
}

function updateDB(sourceId, obj){
  return new Promise(function(resolve, reject) {
    console.log(sourceId, obj);
    resolve();
  });
  db.Catalogue.findOneAndUpdate({sourceId : sourceId}, {$set : obj}).exec();
}

function storeLinks(links){
  var promises = links.map(store);
  return Promise.all(promises)
}

function getLinks(amazonId) {
  var link = "http://www.amazon.in/dp/"+amazonId;
  return axios.get(link)
  .then(function(res){
    var $ = cheerio.load(res.data);
    var thumbs = [];
    var $thumbs = $('#imageBlockThumbs .imageThumb.thumb img');
    $thumbs.each(function(i, el){
      var src = $(this).attr('src');
      src = src.split('_')[0] + 'jpg';
      thumbs.push(src);
    })

    return thumbs;
  })
  .catch(function(e){
    console.log(e);
    return []
  });
}
