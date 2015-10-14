var db = require('../../db');
var Router = require('koa-router');
var content = new Router();

module.exports = content;


content.get('/', function*() {
  yield this.render('home');
})
