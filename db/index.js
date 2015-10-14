var env       = process.env['NODE_ENV'] || 'development';
var config    = require('../config')[env];
var mongoose  = require('mongoose');
mongoose.Promise = global.Promise;

var options = {
  db: { native_parser: true },
  server: { poolSize: 5 },
  // replset: { rs_name: 'myReplicaSetName' },
  // user: 'myUserName',
  // pass: 'myPassword'
}

//NOTE : Uncomment this when in production
if(env == 'production') options.server.socketOptions = { keepAlive: 1 };

mongoose.connect(config.mongo.dburi, options);

var db = {mongoose : mongoose};

var TempUserSchema      = require('./schemas/TempUser');
var UserSchema          = require('./schemas/User');
var BookingSchema       = require('./schemas/Booking');
var CatalogueSchema     = require('./schemas/Catalogue');
var CopounSchema        = require('./schemas/Copoun');
var UserAnalyitcsSchema = require('./schemas/UserAnalytics');
var AdminSchema         = require('./schemas/Admin');
var FeedSchema          = require('./schemas/Feed');

db['TempUser']      = mongoose.model('TempUser', TempUserSchema);
db['User']          = mongoose.model('User', UserSchema);
db['Booking']       = mongoose.model('Booking', BookingSchema);
db['Catalogue']     = mongoose.model('Catalogue', CatalogueSchema);
db['Copoun']        = mongoose.model('Copoun', CopounSchema);
db['UserAnalytics'] = mongoose.model('UserAnalytics', UserAnalyitcsSchema);

db['Admin']         = mongoose.model('Admin', AdminSchema);
db['Feed']          = mongoose.model('Feed', FeedSchema);

db['Catalogue'].collection.createIndex(
  { title: "text", authors : "text" },
  {language_override: "lang", weights: { title : 5, authors : 1 }}
);

module.exports = db;
