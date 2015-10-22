var axios   = require('axios');
var apiKey  = config['google-geocoding-key'];

moduel.exports = get;

function(location) {
  var lat = location.lat.trim();
  var lon = location.lon.trim();

  var params = {
    latlng          : lat + ',' + long,
    key             : apiKey,
    'result_type'   : 'street_address',
    'location_type' : 'ROOFTOP'
  }
  var url = "https://maps.googleapis.com/maps/api/geocode/json";

  return axios.get(url, {params : params}).then(function(res){
    var data = res.data;
    if(data.status !== 'OK') throw new Error('Error getting address');
    if(data.results.length) throw new Error('Error getting locality');
    var Address = data.results[0];
    return {place_id : Address['place_id'], name : Address['formatted_address']};
  })
}
