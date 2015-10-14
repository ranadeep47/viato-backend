var db = require('../db');
var koa = require('koa');
var serve = require('koa-serve');
var bodyParser = require('koa-bodyparser');
var mount = require('koa-mount');
var render = require('koa-swig');

var appConfig = require('../config.json')[process.env['NODE_ENV']];
var app = koa();

app.context.render = render({
  root: path.join(__dirname, 'views'),
  autoescape: true,
  cache: 'memory', // disable, set to false
  ext: 'html'
});


app.use(mount('/img', serve(appConfig['image_dir'])));
app.use(serve(__dirname + '/public'));
app.use(bodyParser());

app.use('/admin/content', require('./content').routes());
app.use('/admin/booking', require('./booking').routes());


var PORT = 3000;
app.listen(PORT);
console.log('Admin started on ', PORT);
