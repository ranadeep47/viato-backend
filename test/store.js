var path = require('path');
var uuid = require('node-uuid');
var fs = require('fs');
var request = require('request');
gm = require('gm');

var COVER_DIR = '/home/viato/images/test/';
var THUMBS_DIR = '/home/viato/images/test/';

module.exports = storeImage;

function storeImage(link) {
  var cover = uuid.v4() + '.jpg';
  var thumb1 = uuid.v4() + '.jpg';
  var thumb2 = uuid.v4() + '.jpg';
  var thumb3 = uuid.v4() + '.jpg';

  var image = request(link).on('error', function(){resolve(null)})

  //image.pipe(fs.createWriteStream(COVER_DIR + cover));
  gm(image)
  .resize('98', '150', '^')
  .gravity('Center')
  .crop('98', '150')
  .write(fs.createWriteStream(THUMBS_DIR + thumb1), function (err) {
    if (!err) console.log(' hooray! ');
  });

  gm(image)
  .resize('147', '225', '^')
  .gravity('Center')
  .crop('147', '225')
  .write(fs.createWriteStream(THUMBS_DIR + thumb2), function (err) {
    if (!err) console.log(' hooray! ');
  });

  gm(image)
  .resize('196', '300', '^')
  .gravity('Center')
  .crop('196', '300')
  .write(fs.createWriteStream(THUMBS_DIR + thumb3), function (err) {
    if (!err) console.log(' hooray! ');
  });




  // image.pipe(sharp().resize(98,150).on('error', function(err){ console.log(err) }))
  // .pipe(fs.createWriteStream(THUMBS_DIR + thumb1));
  //
  // image.pipe(sharp().resize(147,225).on('error', function(err){ console.log(err) }))
  // .pipe(fs.createWriteStream(THUMBS_DIR + thumb2));
  //
  // image.pipe(sharp().resize(196,300).on('error', function(err){ console.log(err) }))
  // .pipe(fs.createWriteStream(THUMBS_DIR + thumb3));

}
