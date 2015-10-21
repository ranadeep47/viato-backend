var enums = {
  RentStatus : ['SCHEDULED FOR PICKUP', 'READING', 'READING-EXTENDED','YET TO DELIVER','UNAVAILABLE','CANCELLED'],
  BookingStatuses : ['PLACED', 'CONFIRMED', 'DISPATCHED', 'DELIVERED' ,'PARTIALLY COMPLETED','COMPLETED', 'CANCELLED'],
  PaymentModes : ['COD'],
  DevicePlatforms : ['Android', 'Web', 'iOS', 'Windows Phone']
}

module.exports = {enums : enums};
