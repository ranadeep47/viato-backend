var db = require('../../db');
var Router = require('koa-router');
var content = new Router();

var storeImage = require('./storeImage');

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
  this.body = this.params['catId'];
})

//Update contents details
content.post('/category/:catId', function*() {

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
