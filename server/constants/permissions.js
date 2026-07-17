export const PERMISSIONS = {
  // Rooms
  ROOMS_VIEW:        'rooms:view',
  ROOMS_CREATE:      'rooms:create',
  ROOMS_UPDATE:      'rooms:update',
  ROOMS_DELETE:      'rooms:delete',
  ROOMS_BLOCK_DATES: 'rooms:block_dates',

  // Bookings
  BOOKINGS_VIEW:     'bookings:view',
  BOOKINGS_CREATE:   'bookings:create',
  BOOKINGS_UPDATE:   'bookings:update',
  BOOKINGS_CANCEL:   'bookings:cancel',
  BOOKINGS_APPROVE:  'bookings:approve',
  BOOKINGS_CHECKIN:  'bookings:checkin',
  BOOKINGS_STATS:    'bookings:stats',

  // Guests
  GUESTS_VIEW:       'guests:view',
  GUESTS_UPDATE:     'guests:update',

  // Coupons
  COUPONS_VIEW:      'coupons:view',
  COUPONS_CREATE:    'coupons:create',
  COUPONS_UPDATE:    'coupons:update',
  COUPONS_DELETE:    'coupons:delete',

  // Reviews
  REVIEWS_VIEW:      'reviews:view',
  REVIEWS_MODERATE:  'reviews:moderate',

  // Analytics
  ANALYTICS_VIEW:    'analytics:view',
  ANALYTICS_EXPORT:  'analytics:export',

  // Hotel
  HOTEL_SETTINGS:    'hotel:settings',

  // Staff
  STAFF_VIEW:        'staff:view',
  STAFF_INVITE:      'staff:invite',
  STAFF_UPDATE:      'staff:update',
  STAFF_REMOVE:      'staff:remove',

  // Chat
  CHAT_VIEW:         'chat:view',
  CHAT_RESPOND:      'chat:respond',

  // Pricing
  PRICING_VIEW:      'pricing:view',
  PRICING_UPDATE:    'pricing:update',
  PRICING_AI:        'pricing:ai',

  // Payments
  PAYMENTS_VIEW:     'payments:view',
  PAYMENTS_CREATE:   'payments:create',
  PAYMENTS_REFUND:   'payments:refund',

  // Housekeeping
  HOUSEKEEPING_VIEW:   'housekeeping:view',
  HOUSEKEEPING_UPDATE: 'housekeeping:update',
};

const ALL = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = {
  superadmin: ALL,
  owner:      ALL,

  manager: [
    'rooms:view','rooms:create','rooms:update','rooms:delete','rooms:block_dates',
    'bookings:view','bookings:create','bookings:update','bookings:cancel',
    'bookings:approve','bookings:checkin','bookings:stats',
    'guests:view','guests:update',
    'coupons:view','coupons:create','coupons:update','coupons:delete',
    'reviews:view','reviews:moderate',
    'analytics:view','analytics:export',
    'hotel:settings',
    'staff:view','staff:invite','staff:update',
    'chat:view','chat:respond',
    'pricing:view','pricing:update','pricing:ai',
    'payments:view','payments:create','payments:refund',
    'housekeeping:view','housekeeping:update',
  ],

  receptionist: [
    'rooms:view','rooms:block_dates',
    'bookings:view','bookings:create','bookings:update','bookings:cancel','bookings:checkin',
    'guests:view','guests:update',
    'coupons:view',
    'reviews:view',
    'chat:view','chat:respond',
    'pricing:view',
    'payments:view','payments:create',
    'housekeeping:view','housekeeping:update',
  ],

  customer: [],
};

export const HOTEL_STAFF_ROLES = ['owner','manager','receptionist'];
export const INVITABLE_ROLES   = ['manager','receptionist'];
