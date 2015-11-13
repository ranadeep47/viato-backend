var request = require('request');

var path = require('path');
var uuid = require('node-uuid');
var fs = require('fs');
var request = require('request');
var gm = require('gm');

var IMAGES_DIR = config['image_dir'] + '/categories/';

module.exports = storeImage;

function storeImage(link) {
  var cover = uuid.v4() + '.jpg';
  var square = uuid.v4() + '.jpg';

  return new Promise(function(resolve, reject) {
    var image = request(link).on('error', function(){resolve(null)})

    gm(image)
    .resize('720', '360', '^')
    .gravity('Center')
    .crop('720', '360')
    .quality(55)
    .stream()
    .pipe(fs.createWriteStream(IMAGES_DIR + cover));

    gm(image)
    .resize('360', '360', '^')
    .gravity('Center')
    .crop('360', '360')
    .quality(55)
    .stream()
    .pipe(fs.createWriteStream(IMAGES_DIR + square));

    return resolve(
      {
        cover : "http://img.viato.in/img/categories/" + cover,
        square : "http://img.viato.in/img/categories/" + square
      }
    );
  });
}
