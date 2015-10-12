var request = require('request');

var path = require('path');
var uuid = require('node-uuid');
var fs = require('fs');
var request = require('request');
var sharp = require('sharp');

var COVER_DIR = '/home/viato/images/covers/';
var THUMBS_DIR = '/home/viato/images/thumbs/';

module.exports = storeImage;

function storeImage(link) {
  var cover = uuid.v4() + '.jpg';
  var thumb = uuid.v4() + '.jpg';

  return new Promise(function(resolve, reject) {
    var image = request(link).on('error', function(){resolve(null)})

    image.pipe(fs.createWriteStream(COVER_DIR + cover));

    image.pipe(sharp().resize(98,150).on('error', function(err){ console.log(err) }))
    .pipe(fs.createWriteStream(THUMBS_DIR + thumb));

    setTimeout(function(){
      resolve({cover : cover, thumb : thumb});
    }, 0)
  });
}
