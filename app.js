var env = process.env['NODE_ENV'];
var config = require('./config')[env];
global.config = config;

var koa = require('koa');
var jwt = require('koa-jwt');
var busboy = require('co-busboy');
var bodyParser = require('koa-bodyparser');
var router = require('koa-router')();
var serve = require('koa-static');
var mount = require('koa-mount');
var compress = require('koa-compress');
var render = require('koa-swig');

var logger = require('./services/logger');
global.logger = logger;

var app = koa();

app.use(function *(next) {
  try {
    yield next;
  } catch (err) {
    this.status = err.status || 500;
    this.body = err.message;

    if(this.status === 500 || this.status === 400) {
      this.app.emit('error', err, this);
      var requestStats = {
        url       : this.url,
        method    : this.method,
        status    : this.status
      }

      if(this.query) requestStats['query'] = this.query;
      if(this.request.body) requestStats['body'] = this.request.body;
      if(this.params) requestStats['params'] = this.params;
      if(/api/.test(this.path)) requestStats['userId'] = this.state.user['userId'];
      requestStats.error = err.stack;

      logger.log('error',err.message ,requestStats);
    }
  }
});

app.use(ignoreAssets(requestLogger()));
app.use(mount('/img',serve(config['image_dir'])));
app.use(bodyParser());
app.use(compress({
  threshold: 2048,
  flush: require('zlib').Z_SYNC_FLUSH
}))

app.context.render = render({
  root: __dirname + '/views',
  autoescape: true,
  cache: 'memory', // disable, set to false
  ext: 'html'
});

app.use(serve(__dirname + '/public'));

//Routing Middleware
router.use('/api',    require('./api/middleware'));
router.use('/api',    jwt({secret : config['json-token-secret']}));
router.use('/api',    require('./api').routes());
router.use('/login',  require('./login').routes());
router.get('/app',    function*(){
  this.redirect('https://play.google.com/store/apps/details?id=in.viato.app');
})

app.use(router.routes());

app.listen(config.server.port);
console.log('Server listening on port : ', config.server.port);

require('./services/expireCheckCron');

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

function requestLogger(){
  return function *(next) {
    var start = Date.now();
    yield next;
    var timeTaken = Date.now() - start;
    var requestStats = {
      url       : this.url,
      method    : this.method,
      status    : this.status,
      length    : this.length,
      timeTaken : timeTaken
    }
    if(/api/.test(this.path)) requestStats['userId'] = this.state.user['userId'];
    logger.log('info',requestStats);
  }
}

function logRequest(){

}
