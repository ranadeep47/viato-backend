var db = require('../db');

exports.addCoupon = addCoupon;


function addCoupon(mobile, body){
  return db.User.findOne({mobile : mobile}).select('mobile').exec()
  .then(function(User){
    if(!User) return null;
    var userId = User['_id'];
    var Coupoun = {
      number        : body.number,
      type          : body.type,
      min_amount    : body.min,
      code          : body.code,
      expires_at    : body.expires_at,
      applied_at    : null,
      use_multiple : body.use_multiple
    }

    return db.User.addCoupon(userId, Coupoun);
  })
}
