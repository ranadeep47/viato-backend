var axios = require('axios');
var _ = require('lodash');
var cheerio = require('cheerio');
var store = require('./amazonImage');
var request = require('request');

module.exports = fetch;

//Returns null or a Catalogue Object from a given amazonId
function fetch(amazonId) {
  var link = "http://www.amazon.in/dp/"+amazonId;
  return axios.get(link)
  .then(function(res){
    var $ = cheerio.load(res.data);
    var item = parsePage($);
    return item.then(function(book){
        book['sourceId'] = amazonId;
        return book;
    });
  })
  .catch(function(e){
    console.log(e);
    return null;
  });
}

function parsePage($) {
  var owning = getPrice($);
  var rent = Math.round(0.25 * owning.mrp);
  var rental = [{rent : rent, period : 15}];

  var images = getImages($);
  var promises = images.map(store);
  return Promise.all(promises).then(function(images){
    var covers = _.pluck(images, 'cover');
    var thumbs = _.pluck(images, 'thumb');

    var book = {
      title       : getBookTitle($),
      description : getDescription($),
      authors     : getAuthors($),
      pricing      : {
        owning : owning,
        rental : rental
      },
      releaseDate : getBookReleaseDate($),
      categories  : getBreadCrumbs($),
      cover       : images[0].cover,
      images      : covers,
      thumbs      : thumbs,
      similar     : {
        bab : getBAB($),
        bav : getBAV($),
        fbt : getFBT($),
        fsa : [],
      },
    }
    _.extend(book, otherDetails($));

    //Accessory fields
    book.copies = 0;
    book.source = 'AMAZON';
    if(book.owning.mrp > 0 && book.owning.mrp <= 1000){
      book.available = true;
    }
    else book.available = false;

    return getGoodReadsPopularity(book.isbn13).then(function(resp){
      book.popularity = resp.popularity;
      book.description = resp.description;
      return book;
    })
    .catch(function(){
      var resp = getAmazonPopularity($);
      book.popularity = resp.popularity;
      book.description = resp.description;
      return book;
    });
  })
}

function getGoodReadsPopularity(isbn13){
  var url = "http://www.goodreads.com/search?utf8=%E2%9C%93&query="+isbn13;
  return new Promise(function(resolve, reject) {
    request.get(url,function(e,r,d){
      var $ = cheerio.load(d);
      var rating       = parseFloat($('.average').text())
      var ratingsCount = parseInt($('.votes').text().replace(',',''));
      var reviewCount  = parseInt($('.count').text().replace(',',''));
      var description  = $('#description span~span').html() || '';

      if(description === '') {
        description = $('#description span').html() || '';
      }

      if(isNaN(rating)) rating = 0;
      if(isNaN(ratingsCount)) ratingsCount = 0;
      if(isNaN(reviewCount)) reviewCount = 0;

      if(rating === 0 && ratingsCount === 0 && reviewCount === 0){
        throw new Error('Cant believe this data');
      }

      var doc = {
        popularity : {
          rating : rating,
          ratingsCount : ratingsCount,
          reviewsCount : reviewCount,
        },
        description : description
      }

      resolve(doc);
    });
  })
}

function getAmazonPopularity($){
  var rating       = parseFloat($('#avgRating').text().replace('out of 5 stars', '')) || 0;
  var ratingsCount = parseInt($('#acrCustomerReviewText').text()) || 0;
  var description  = $('#bookDescription_feature_div noscript').html() || '';

  if(isNaN(rating)) rating = 0;
  if(isNaN(ratingsCount)) ratingsCount = 0;

  var reviewCount = ratingsCount;

  var doc = {
    popularity : {
      rating : rating,
      ratingsCount : ratingsCount,
      reviewsCount : reviewCount,
    },
    description : description
  }

  return doc;
}

function getBookTitle($){
  return $('#productTitle').text().trim();
}

function getDescription($){
  return $('#bookDescription_feature_div noscript').html().trim();
}

function otherDetails($){
  var details = {}
  var $details = $('#detail_bullets_id li');
  while( !/pages/.test($details.eq(0).text().split(':')[1]) && !/Paperback/.test($details.eq(0).text().split(':')[0]) ){
    $details = $details.slice(1);
  }
  $details.each(function(i, el){
    var arr = $(this).text().split(':');
    switch(i) {
      case 0 :
        details['binding'] = arr[0];
        if(arr[1]){
          details['pages'] = parseInt(arr[1].trim().split(' ')[0]);
        }
        else details['pages'] = 0
        break;
      case 1 :
        if(arr[0].trim() == 'Publisher') {
          var publisher = arr[1];
          details['publisher'] = publisher.split(';')[0];
          var date = null;
          try {
            var date = publisher.match(/\([\w\s]+\)/g)[0].replace(/\(/, '').replace(/\)/,'');
          } catch(e) {}
          details['publishDate'] = new Date(date);
          //TODO
        }
        break;
      case 2 :
        if(arr[0].trim() == 'Language') {
            details['language'] = arr[1].trim();
        }
        break;
      default :
          if(arr[0].trim() == 'ISBN-10'){
            details['isbn10'] = arr[1].trim();
          }
          if(arr[0].trim() == 'ISBN-13') {
            details['isbn13'] = arr[1].split('-').join('').trim();
          }
          if(arr[0].trim() == 'Product Dimensions') {
            details['dimensions'] = arr[1].trim();
          }
          try{
            details['rating'] = parseFloat($('#revFMSR .a-link-normal').attr('title').replace('out of 5 stars', '')) || 0
          } catch(e) {
            details['rating'] = 0;
          }

        break;
      }
  })

  return details;
}


function getAuthors($){
  var authors = [];
  var $links = $('.author  a.contributorNameID');
  var $moreLinks = $('.author > a');

  $moreLinks.each(function(i, el){
    authors.push($(this).text());
  })

  $links.each(function(i, el){
    authors.push($(this).text());
  })

  return authors;
}


function getPrice($){
  var mrp;
  var offerPrice = $('#soldByThirdParty .a-color-price').text().trim()
  if($('#buyBoxInner .a-text-strike').length > 0){
    mrp = $('#buyBoxInner .a-text-strike').text().trim();
  }
  else mrp = offerPrice;

  mrp = parseFloat(mrp.replace(',', ''));
  offerPrice = parseFloat(offerPrice.replace(',', ''));

  if(isNaN(mrp)) mrp = 0;
  if(isNaN(offerPrice)) offerPrice = 0;

  return {
    mrp : mrp,
    amazonPrice : offerPrice
  }
}

function getImages($){
  var thumbs = [];
  var $thumbs = $('#imageBlockThumbs .imageThumb.thumb img');
  $thumbs.each(function(i, el){
    var src = $(this).attr('src');
    src = src.split('_')[0] + 'jpg';
    thumbs.push(src);
  })

  return thumbs;
}

function getBAB($){
  var items = [];
  var $items = $('#purchase-sims-feature .a-carousel-card > div > a.a-link-normal');
  $items.each(function(i, el) {
    items.push(parseBookId($(this).attr('href')));
  })

  return items;
}

function getBAV($){
  var items = [];
  var $items = $('#view_to_purchase-sims-feature li .a-row > .a-link-normal');
  $items.each(function(i, el){
    items.push(parseBookId($(this).attr('href')));
  })

  return items;
}

function getFBT($){
  var items = [];
  var $items = $('#sims-fbt-form input[name^="discover"]');
  $items.each(function(i, el){
    items.push($(this).attr('value'));
  })

  return items;
}

function getBookReleaseDate($){
  var dateString = $('#title .a-size-medium.a-color-secondary.a-text-normal').text();
  return new Date(dateString);
}



function getBreadCrumbs($){
  var breadcrumb = {};
  var $cats = $('#wayfinding-breadcrumbs_feature_div li .a-link-normal');
  $cats.each(function(i, el){
    var categoryType;
    switch(i) {
      case 0 :
        categoryType = 'section';
        break;
      case 1 :
        categoryType = 'category';
        break;
      case 2 :
        categoryType = 'subCategory';
        break;
    }
    breadcrumb[categoryType] = {
        title : $(this).text().trim(),
        id : $(this).attr('href').match(/node=[0-9a-zA-Z]+/g)[0].replace(/node=/g, '')
    };
  });

  return breadcrumb;
}

function parseBookId(amazonLink){
  return amazonLink.match(/dp\/[0-9a-zA-Z]+/)[0].replace('dp\/', '');
}
