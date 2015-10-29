var koa = require('koa');
var jwt = require('koa-jwt');
var busboy = require('co-busboy');
var bodyParser = require('koa-bodyparser');
var logger = require('koa-logger');
var router = require('koa-router')();
var serve = require('koa-static');
var mount = require('koa-mount');
var compress = require('koa-compress');

require('./services/expireCheckCron');

var env = process.env['NODE_ENV'];
var config = require('./config')[env];
global.config = config;

var app = koa();

app.use(ignoreAssets(logger()));
app.use(mount('/img',serve(config['image_dir'])));
app.use(bodyParser());
app.use(compress({
  threshold: 2048,
  flush: require('zlib').Z_SYNC_FLUSH
}))
//Routing Middleware
router.use('/api', jwt({secret : config['json-token-secret']}));
router.use('/api', require('./api').routes());
router.use('/login', require('./login').routes());
app.use(router.routes());

app.listen(config.server.port);
console.log('Server listening on port : ', config.server.port);

function ignoreAssets(mw) {
  return function *(next){
    if (/(\.js|\.css|\.ico)$/.test(this.path)) {
      yield next;
    } else {
      // must .call() to explicitly set the receiver
      // so that "this" remains the koa Context
      yield mw.call(this, next);
    }
  }
}
