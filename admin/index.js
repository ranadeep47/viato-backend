var db = require('../db');
var koa = require('koa');
var serve = require('koa-static');
var bodyParser = require('koa-bodyparser');
var mount = require('koa-mount');
var render = require('koa-swig');

var Router = require('koa-router');
var api = new Router();

global.config = require('../config.json')[process.env['NODE_ENV'] || 'production'];
var app = koa();

app.context.render = render({
  root: __dirname + '/views',
  autoescape: true,
  cache: 'memory', // disable, set to false
  ext: 'html'
});


app.use(mount('/img', serve(config['image_dir'])));
app.use(serve(__dirname + '/public'));
app.use(bodyParser());

api.use('/admin/content', require('./content').routes());
api.use('/admin/booking', require('./booking').routes());
api.use('/admin/services/', require('./services').routes());
api.use('/admin/catalogue/', require('./catalogue').routes());

app.use(api.routes());

var PORT = 3000;
app.listen(PORT);
console.log('Admin started on ', PORT);
