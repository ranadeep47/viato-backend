var db = require('../db');
var _ = require('lodash');

exports.bookingPayment = bookingPayment;
exports.validateCopoun = validateCopoun;
exports.calculateShipping = calculateShipping;

function bookingPayment(Cart, Copouns, copounCode){
  var cartTotal     = cartValue(Cart);
  var otherCharges  = calculateOtherCharges(Cart);
  var tax           = calculateTax(Cart);
  var total         = cartTotal + tax + otherCharges;
  var discount      = calculateDiscount(Cart);
  var totalPayable  = total - discount;

  var copounId = null;
  var copounDiscount = 0;

  if(copounCode) {
    var Response = validateCopoun(Cart, Copouns, copounCode);
    if(Response.isApplicable) {
      var Copoun = Response.copoun;
      copounDiscount = calculateCouponDiscount(totalPayable, Copoun);
      copounId = Copoun['_id'];
    }
  }

  var totalPayable = totalPayable - copounDiscount;
  var shippingCharges = calculateShipping(Cart);

  totalPayable  += shippingCharges;

  var Payment = {
    payment_mode      : 'COD',
    total_payable     : totalPayable,
    total             : total,
    tax               : tax,
    other_charges     : otherCharges,
    discount          : discount,
    copoun_discount   : copounDiscount,
    copoun_applied    : copounId,
    shipping_charges  : shippingCharges
  }

  return Payment;
}

function validateCopoun(Cart, Copouns, code){
  var Response = {isApplicable : false, reason : ''};

  var Copouns = _.filter(Copouns, function(coups){
    return coups.code === code;
  })

  if(!Copouns.length) {
    Response.reason = "Coupon doesn't exist. Please check & try again";
    return Response;
  }
  //Copoun exists
  if(Copouns.length > 1) console.warn('There are more than 1 Copouns with the same code');
  var Copoun = _.find(Copouns, function(c){
    return c['expires_at'] >= new Date();
  });

  if(!Copoun){
    Response.reason = "Sorry! Copoun expired.";
    return Response;
  }

  if(!Copoun['applied_at'] || Copoun['use_multiple']){
    var cartTotal = cartValue(Cart);
    if(cartTotal < Copoun['min_amount']){
      Response.reason = 'Minium order amount for coupon to be applied is ' + Copoun['min_amount'];
    }
    else {
      Response.isApplicable = true;
      Response.reason       = 'Coupon applied successfully!';
      var totalPayable      = cartTotal + calculateOtherCharges(Cart) + calculateTax(Cart) - calculateDiscount(Cart);
      Response.discount     = calculateCouponDiscount(totalPayable, Copoun);
      Response.copoun = Copoun;
    }
  }
  else {
    Response.reason = 'Sorry. You already used the coupon!'
  }

  return Response;
}

function cartValue(Cart){
  var total = Cart.reduce(function(total, next){
    total += next.pricing.rent;
    return total;
  }, 0)

  return total;
}

function calculateCouponDiscount(total, Copoun){
  var copounDiscount = 0;
  copounId = Copoun['_id'];
  switch(Copoun.type) {
    case 'CASH' :
      copounDiscount = total - Copoun['number'];
      break;
    case 'PERCENT' :
      var copounDiscount = parseInt(Copoun['number'] / 100 * total);
      break;
  }

  if(copounDiscount > total) copounDiscount = total;
  return Math.floor(copounDiscount);
}

function calculateDiscount(Cart){
  return 0;
}

function calculateTax(Cart){
  return 0;
}

function calculateOtherCharges(Cart){
  return 0;
}

function calculateShipping(Cart){
  //TODO based on cart value
  var total = cartValue(Cart);
  if(total < 50) return 30;
  else return 0;
}
