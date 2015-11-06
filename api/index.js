var Router = require('koa-router');
var api = new Router();

module.exports = api;

api.use('/version', require('./versioning').routes());
api.use('/geo', require('./geo').routes());
api.use('/books', require('./books').routes());
api.use('/feed', require('./feed').routes());
api.use('/search', require('./search').routes());
api.use('/user/mybooks', require('./mybooks').routes());
api.use('/user/bookings', require('./bookings').routes());
api.use('/user/address', require('./address').routes());
api.use('/user/cart', require('./cart').routes());
