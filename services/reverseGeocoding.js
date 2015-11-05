var axios   = require('axios');
var apiKey  = config['google-geocoding-key'];
var _       = require('lodash');

exports.isSupported     = isSupported;
exports.getLocality     = getLocality;
exports.getSupported    = getSupported;
exports.isAddressServed = isAddressServed;

var supported_localities = [
  "Powai",
  "Andheri East",
  "Andheri West",
  "Jogeshwari East",
  "Jogeshwari West",
  "Sakinaka",
  "Kanjurmarg West",
  "Vikhroli West",
  "Ghatkopar West",
  "Kurla"
]

function isAddressServed(address){
  var placeId = address.locality.placeId;
  var params = {place_id : placeId, key : apiKey}
  return get(params).then(function(Address){
    var obj = {supported_localities : supported_localities};
    if(!Address) obj.is_supported = false;
    else {
      obj = isSupportedAddress(Address);
    }

    return obj;
  })
}

function isSupported(location){
  return get(location).then(function(Address){
    return isSupportedAddress(Address);
  });
}

function isSupportedAddress(Address){
  var Locality = _.find(Address.address_components,function(o) { return o.types.indexOf('sublocality_level_1') >= 0 });
  var is_supported = supported_localities.indexOf(Locality.long_name) >= 0 ? true : false;
  return {is_supported : is_supported, supported_localities : supported_localities}
}

function getSupported(){
  return supported_localities;
}

function getLocality(location) {
  var lat = location.lat.trim();
  var lon = location.lon.trim();
  var params = {
    latlng          : lat + ',' + lon,
    key             : apiKey,
    'result_type'   : 'street_address',
    'location_type' : 'ROOFTOP'
  }
  return get(params).then(function(Address){
    if(!Address) return {placeId : "", name : ""}
    return {placeId : Address['place_id'], name : Address['formatted_address']};
  });
}

function get(params){
  var url = "https://maps.googleapis.com/maps/api/geocode/json";
  return axios.get(url, {params : params}).then(function(res){
    var data = res.data;
    if(data.status !== 'OK') throw new Error('Error getting address');
    if(!data.results.length) throw new Error('Error getting locality');
    var Address = data.results[0];
    return Address;
  })
}
