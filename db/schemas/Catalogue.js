var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var _ = require('lodash');
var BasicItemSchema = require('./BasicItem');


var Constants = require('../../constants');
var SchemaUtils = require('../utils');

var CatalogueSchema = new Schema({
  title         : {type : String, required : true, trim : true},
  cover         : String,
  authors       : [{type : String, required : true, trim : true}],
  pricing       : {
      _id     : false,
      owning  : Schema.Types.Mixed,
      rental  : [{
            rent    : {type : Number, min : 0, required : true},
            period  : {type : Number, min : 0, required : true}
      }]
  },
  images        : {type : [String], default : []},
  thumbs        : {type : [String], default : []},
  description   : {type : String, default : 'No description'},
  pages         : {type : Number, default : 0},
  publisher     : {type : String, default : 'Unknown'},
  isbn10        : {type : String, default : 'Unknown'},
  isbn13        : {type : String, default : 'Unknown'},
  rating        : {type : Number, default : 0},
  releaseDate   : {type : Date},
  publishDate   : {type : Date},
  language      : {type : String, enum : Constants.enums.Languages},
  binding       : {type : String},
  categories    : {type : Schema.Types.Mixed, default : {}},
  dimensions    : {type : String},
  copies        : {type : Number, default : 0},
  available     : {type : Boolean, required : true},
  source        : {type : String, enum : ['AMAZON','GOOGLE'], required : true},
  sourceId      : {type : String, required : true, unique : true},
  similar       : {
    _id : false,
    fsa : {type : [BasicItemSchema], default : []}, //From Same Author
    bab : {type : [BasicItemSchema], default : []}, //Bought also bhought
    bav : {type : [BasicItemSchema], default : []}, //Bought also viewed
    fbt : {type : [BasicItemSchema], default : []} //Frequently bought together
  },
  // reviews       : {
  //   _id     : false,
  //   users   : {type : [ReviewSchema], default : []},
  //   others  : {type : [ReviewSchema], default : []}
  // }
}, SchemaUtils.defaultOptions);

module.exports = CatalogueSchema;

var BASIC_FIELDS = ['title','cover','authors','pricing','thumbs']

CatalogueSchema.path('isbn13').index(true);


CatalogueSchema.statics.getItemForCart = function(catalogueId, rentalId) {
  var fields = BASIC_FIELDS;
  return this.findOne({_id : catalogueId}).select(fields.join(' ')).exec()
  .then(function(doc){
    if(!doc) throw new Error('Invalid catalogueId');
    //Get the apporopriate rental based on the rental's _id
    var item = _.pick(doc, fields);

    item.pricing = _.filter(doc.pricing.rental, function(r){
      return r['_id'].toString() === rentalId
    })[0];
    if(!item.pricing) throw new Error('Invalid rentalId');

    item.catalogueId = doc['_id'];
    return item;
  });
}

CatalogueSchema.statics.getBasicItem = function(catalogueId) {
  var fields = BASIC_FIELDS;
  return this.findOne({_id : catalogueId}).select(fields.join(' ')).exec()
  .then(function(doc){
    if(!doc) throw new Error('Invalid catalogueId');
    var item = _.pick(doc, fields);
    item.pricing = doc.pricing.rental[0];
    item.catalogueId = doc['_id'];
    item.extraKey = '';
    item.extraId = null;
    return item;
  })
}

CatalogueSchema.statics.search = function(query){
  var fields = BASIC_FIELDS.concat(['isbn13']);
  return this.find({$text : {$search : query}},{ score: { $meta: "textScore" }})
  .select(fields.join(' '))
  .sort({score : {$meta : "textScore"}, rating : -1})
  .limit(10)
  .exec()
  .then(function(docs){
    return docs.map(function(doc){
      var item          = _.pick(doc, fields);
      item.pricing      = doc.pricing.rental[0];
      item.catalogueId  = doc['_id'];
      item.extraKey     = "VIATO";
      item.extraId      = doc['_id'];
      return item;
    });
  })
}

CatalogueSchema.statics.getBookDetail = function(catalogueId) {

}

CatalogueSchema.statics.addReview = function(userId, bookId, rating, review) {

}
