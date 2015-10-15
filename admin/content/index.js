var db = require('../../db');
var Router = require('koa-router');
var content = new Router();
var fs = require('fs');

var storeImage = require('./storeImage');
var amazonFetch = require('../../services/amazon');

module.exports = content;


content.get('/', function*() {
  var docs = yield db.Feed.find().select('-list').exec();
  yield this.render('content-home', {categories : docs});
})

content.get('/category/add', function*(){
  yield this.render('add-category');
})

//Add a category
content.post('/category/add', function*(){
  var title = this.request.body['title'];
  var image = this.request.body['image'];
  if(!title || !image) return this.throw(400);

  //Fetch, resize and store cover images
  var category = yield storeImage(image)
  .then(function(image){
    return db.Feed.create({
      title : title,
      images : image,
      list : []
    });
  });

  // this.redirect('/admin/content/category/'+category['_id']);
  this.redirect('/admin/content');
})


//Get a category detail page
content.get('/category/:catId', function*(){
  var catId = this.params['catId'];
  var category = yield db.Feed.findOne({_id : catId}).exec();
  yield this.render('category-detail', {category : category});
})

//Update contents details
content.post('/category/:catId', function*() {
  var catId = this.params['catId'];
  if('list' in this.request.body) {
    var list = this.request.body['list'];
    var done = yield addBooks(catId,list);
    if(done) this.body = 'Updated';
    else this.throw(500);
  }
  else if ('title' in this.request.body) {
    var message = yield db.Feed.update({_id : catId}, {$set : {title : title}}).exec();
    if(message.ok) this.body = 'Updated'
    else this.throw(500)
  }
  else {
    var image = this.request.body;
    //Remove the existing image and fetch & update new image
    var message = yield db.Feed.findOne({_id : catId}).exec()
    .then(function(category){
      var cover = category['images']['cover'].split('/').pop();
      var square = category['images']['square'].split('/').pop();
      var path = config['image_dir'] + '/categories/';
      //Delete existing images
      fs.unlink(path + cover);
      fs.unlink(path + square);

      return storeImage(image).then(function(img){
        return db.Feed.update({_id : catId}, {$set : {images : img}}).exec();
      });
    })

    if(message.ok) this.body = 'Updated';
    else this.throw(500);
  }
})

//Add items to categories from amazonIds
content.post('/category/items', function*() {

})

//Get an items details from the category
content.get('/category/:catId/item/:itemId', function*(){

})

//Update an item's detail - Modify catalogue and refresh the item in all categories
content.post('/category/:catId/item/:itemId', function*(){

})

function addBooks(catId, list) {
  //Fetch books from amazon one by one
  return list.reduce(function(cur, next){
    return cur.then(function(){
      var currentItem = next;
      return db.Catalogue.findOne({sourceId : currentItem}).exec()
      .then(function(item){
        if(!item) {
          //Fetch
          return amazonFetch(currentItem).then(function(book){
            db.Catalogue.create(book)
            .then(function(catalogueItem){
              return db.Catalogue.getBasicItem(catalogueItem._id).then(function(cItem){
                console.log(cItem);
                return cItem;
                //TODO insert in feed
              })
            })
            .catch(function(e){ console.log(e); return null;})
          })
        }
        else return null;
      })
      .catch(function(e){ console.log(e); return null;})
    })
  }, Promise.resolve())
  .then(function(){
    console.log('All done');
    return true;
  })
  .catch(function(e){
    console.log(e);
    return false;
  })
}
