var request = require('request');

var path = require('path');
var uuid = require('node-uuid');
var fs = require('fs');
var request = require('request');
var gm = require('gm');

var COVER_DIR = config['image_dir'] + '/covers/';
var THUMBS_DIR = config['image_dir'] + '/thumbs/';

module.exports = storeImage;

function storeImage(link) {
  var cover = thumb = uuid.v4() + '.jpg';

  return new Promise(function(resolve, reject) {
    var image = request(link).on('error', function(){resolve(null)})

    image.pipe(fs.createWriteStream(COVER_DIR + cover));

    gm(image)
    .resize('196', '300', '^')
    .gravity('Center')
    .crop('196', '300')
    .quality(55)
    .stream()
    .pipe(fs.createWriteStream(THUMBS_DIR + thumb));

    setTimeout(function(){
      resolve(
        {
          cover : "http://viato.in/img/covers/" + cover,
          thumb : "http://viato.in/img/thumbs/" + thumb
        }
      );
    }, 0)
  });
}
