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
            deposit : {type : Number, min : 0, default : 0},
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
  isbn13        : {type : [String], default : ['Unknown']},
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
    fsa : {type : [String], default : []}, //From Same Author
    bab : {type : [String], default : []}, //Bought also bhought
    bav : {type : [String], default : []}, //Bought also viewed
    fbt : {type : [String], default : []} //Frequently bought together
  },
  popularity  : {
    rating        : {type : Number, default : 0},
    ratingsCount  : {type : Number, default : 0},
    reviewsCount  : {type : Number, default : 0}
  }
  // reviews       : {
  //   _id     : false,
  //   users   : {type : [ReviewSchema], default : []},
  //   others  : {type : [ReviewSchema], default : []}
  // }
}, SchemaUtils.defaultOptions);

module.exports = CatalogueSchema;

var BASIC_FIELDS = ['title','cover','authors','pricing','thumbs']

module.exports.BASIC_FIELDS = BASIC_FIELDS;

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

    item.catalogueId = doc['_id'].toString();
    return item;
  });
}

CatalogueSchema.statics.getBasicItem = function(catalogueId, extras) {
  var fields = BASIC_FIELDS;
  if(extras) fields = BASIC_FIELDS.concat(extras);
  return this.findOne({_id : catalogueId}).select(fields.join(' ')).exec()
  .then(function(doc){
    if(!doc) throw new Error('Invalid catalogueId');
    var item = _.pick(doc, fields);
    item.pricing = doc.pricing.rental[0];
    item.pricing.mrp = doc['pricing']['owning']['mrp']    
    item.catalogueId = doc['_id'].toString();
    item.extraKey = '';
    item.extraId = null;
    return item;
  })
}

CatalogueSchema.statics.search = function(query){
  var fields = BASIC_FIELDS.concat(['isbn13']);
  return this.find({$text : {$search : query}},{ score: { $meta: "textScore" }})
  .select((fields.concat(['language'])).join(' '))
  .sort({score : {$meta : "textScore"}, rating : -1})
  .limit(25)
  .exec()
  .then(function(docs){
    //Show english first
    var others = [];
    var english = _.filter(docs, function(doc){
      if(doc.language !== 'English') others.push(doc);
      else return true;
    });
    docs = english.concat(others);

    return docs.map(function(doc){
      var item          = _.pick(doc, fields);
      item.pricing      = doc.pricing.rental[0];
      item.catalogueId  = doc['_id'].toString();
      item.extraKey     = "VIATO";
      item.extraId      = doc['_id'].toString();
      return item;
    });
  })
}

CatalogueSchema.statics.getBookDetail = function(catalogueId) {
  return this.findOne({_id : catalogueId}).exec();
}

CatalogueSchema.statics.addReview = function(userId, bookId, rating, review) {

}
