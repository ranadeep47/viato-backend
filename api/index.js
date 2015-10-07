var Router = require('koa-router');
var api = new Router();

module.exports = api;

api.use('/mybooks', require('./mybooks').routes());
api.use('/books', require('./books').routes());
api.use('/user/search', require('./search').routes());
api.use('/user/bookings', require('./bookings').routes());
api.use('/user/address', require('./address').routes());
api.use('/user/cart', require('./cart').routes());
