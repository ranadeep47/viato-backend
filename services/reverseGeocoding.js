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
  var obj = {is_supported : true, supported_localities : supported_localities};
  if(!placeId) return new Promise(function(resolve, reject) {
    resolve(obj);
  });

  return get(params).then(function(Address){
    if(!Address) obj.is_supported = false;
    else return isSupportedAddress(Address);
    return obj;
  })
  .catch(function(){
    return obj; //In case of error just say its supported and deal with it later
  })

}

function isSupported(location){
  var lat = location.lat.trim();
  var lon = location.lon.trim();
  var params = {
    latlng          : lat + ',' + lon,
    key             : apiKey,
    'result_type'   : 'street_address',
    'location_type' : 'ROOFTOP'
  }
  return get(params).then(function(Address){
    return isSupportedAddress(Address);
  })
}

function isSupportedAddress(Address){
  var Locality = _.find(Address.address_components,function(o) {
    if(o.types.indexOf('locality') >= 0) return true;
  });

  if(!Locality) {
    Locality =  _.find(Address.address_components,function(o) {
      if(o.types.indexOf('sublocality_level_1') >= 0) return true;
      if(o.types.indexOf('sublocality') >= 0) return true;
    });
  }
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
    if(!data.results.length) {
      delete params['location_type'];
      return axios.get(url, {params : params}).then(function(res){
        if(res.data.results.length) {
          return res.data.results[0];
        }
        else {
          params['result_type'] = 'locality';
          return axios.get(url, {params : params}).then(function(res){
            if(res.data.results.length) {
              return res.data.results[0];
            }
            else throw new Error('Error getting locality');
          })
        }
      })
    }
    return data.results[0];
  })
}
