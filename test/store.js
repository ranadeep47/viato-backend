var path = require('path');
var uuid = require('node-uuid');
var fs = require('fs');
var request = require('request');
gm = require('gm');

var COVER_DIR = '/home/viato/images/test/';
var THUMBS_DIR = '/home/viato/images/test/';

module.exports = storeImage;

function storeImage(link) {
  var cover = thumb = uuid.v4() + '.jpg';

  var image = request(link).on('error', function(){resolve(null)})

  //image.pipe(fs.createWriteStream(COVER_DIR + cover));

  gm(image)
  .resize('196', '300', '^')
  .gravity('Center')
  .crop('196', '300')
  .quality(55)
  .stream()
  .pipe(fs.createWriteStream(THUMBS_DIR + thumb));






  // image.pipe(sharp().resize(98,150).on('error', function(err){ console.log(err) }))
  // .pipe(fs.createWriteStream(THUMBS_DIR + thumb1));
  //
  // image.pipe(sharp().resize(147,225).on('error', function(err){ console.log(err) }))
  // .pipe(fs.createWriteStream(THUMBS_DIR + thumb2));
  //
  // image.pipe(sharp().resize(196,300).on('error', function(err){ console.log(err) }))
  // .pipe(fs.createWriteStream(THUMBS_DIR + thumb3));

}
