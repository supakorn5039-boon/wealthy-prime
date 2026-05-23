export const API = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_PROFILE: '/auth/profile',

  // Properties
  PROPERTIES: '/properties',
  PROPERTY_DETAIL: (id: number | string) => `/properties/${id}`,
  PROPERTY_IMAGES: (id: number | string) => `/properties/${id}/images`,
  PROPERTY_STATUS: (id: number | string) => `/properties/${id}/status`,
  PROPERTY_REVIEWS: (id: number | string) => `/properties/${id}/reviews`,

  // Bookings
  BOOKINGS: '/bookings',
  BOOKING_DETAIL: (id: number | string) => `/bookings/${id}`,

  // Wishlist
  WISHLIST: '/wishlist',
  WISHLIST_ITEM: (propertyId: number | string) => `/wishlist/${propertyId}`,

  // Reviews
  REVIEWS: '/reviews',
  REVIEW_BY_TOKEN: (token: string) => `/reviews/token/${token}`,

  // Agent
  AGENT_DASHBOARD: '/agent/dashboard',
  AGENT_PROPERTIES: '/agent/properties',
  AGENT_CONTACTS: '/agent/contacts',
  AGENT_CONTACT_NOTE: (id: number | string) => `/agent/contacts/${id}/note`,
  AGENT_REVIEW_LINK: '/agent/review-link',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PENDING: '/admin/pending',
  ADMIN_PENDING_APPROVE: (id: number | string) => `/admin/pending/${id}/approve`,
  ADMIN_PENDING_REJECT: (id: number | string) => `/admin/pending/${id}/reject`,
  ADMIN_AGENTS: '/admin/agents',
  ADMIN_AGENT_DETAIL: (id: number | string) => `/admin/agents/${id}`,
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: (id: number | string) => `/admin/users/${id}`,
  ADMIN_REASSIGN: '/admin/reassign',
  ADMIN_FINANCIAL: '/admin/financial',
  ADMIN_FINANCIAL_EXPORT: '/admin/financial/export',
} as const
