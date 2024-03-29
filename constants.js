var enums = {
  RentStatus      : ['YET TO DELIVER','READING', 'READING-EXTENDED', 'CANCELLED', 'SCHEDULED FOR PICKUP', 'RETURNED'],
  BookingStatuses : ['PLACED', 'CONFIRMED', 'DISPATCHED', 'DELIVERED' ,'PARTIALLY COMPLETED','COMPLETED', 'CANCELLED'],
  PaymentModes    : ['COD'],
  DevicePlatforms : ['Android', 'Web', 'iOS', 'Windows Phone'],
  FeedTypes       : ['GENRES', 'TRENDING', 'SPECIAL-LIST'],
  CopounTypes     : ['PERCENT', 'CASH'],
}

module.exports = {
  enums : enums,
  ContactNumber   : '7506399696'
};
