var winston = require('winston');
var moment  = require('moment-timezone');
var _       = require('lodash');

/**
 * Requiring `winston-mongodb` will expose
 * `winston.transports.MongoDB`
 */
 require('winston-mongodb').MongoDB;

var consoleOptions = {
  name        : 'console-info-logger',
  level       : 'info',
  colorize    : true,
  // prettyPrint : true,
  depth       : null, // set 2 ?
  timestamp   : function(){
    return moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm');
  }
}

var mongoOptions = {
  db          : config.mongo.loguri,
  options     : {}
}

var mongoErrorOptions = _.extend({
  name        : 'mongo-info-logger',
  level       : 'error',
  collection  : 'errors'
},mongoOptions);


var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(consoleOptions),
    new (winston.transports.MongoDB)(mongoErrorOptions)
  ]
});

var mongoExceptionOptions = _.extend({
  collection : 'exceptions',
  humanReadableUnhandledException: true
}, mongoOptions);

winston.handleExceptions(new winston.transports.MongoDB(mongoExceptionOptions));

module.exports = logger;
