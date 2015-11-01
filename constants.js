var enums = {
  RentStatus      : ['YET TO DELIVER','READING', 'READING-EXTENDED', 'CANCELLED', 'SCHEDULED FOR PICKUP', 'RETURNED'],
  BookingStatuses : ['PLACED', 'CONFIRMED', 'DISPATCHED', 'DELIVERED' ,'PARTIALLY COMPLETED','COMPLETED', 'CANCELLED'],
  PaymentModes    : ['COD'],
  DevicePlatforms : ['Android', 'Web', 'iOS', 'Windows Phone'],
  FeedTypes       : ['GENRES', 'TRENDING', 'SPECIAL-LIST']
}

module.exports = {enums : enums};
