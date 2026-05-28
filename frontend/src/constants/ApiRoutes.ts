export const API = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_PROFILE: '/auth/profile',

  // Properties (public)
  PROPERTIES: '/properties',
  PROPERTY_DETAIL: (id: number | string) => `/properties/${id}`,
  PROPERTY_STATUS: (id: number | string) => `/properties/${id}/status`,
  PROPERTY_REVIEWS: (id: number | string) => `/properties/${id}/reviews`,

  // User scoped
  BOOKINGS: '/user/bookings',
  BOOKING_DETAIL: (id: number | string) => `/user/bookings/${id}`,
  WISHLIST: '/user/wishlist',
  WISHLIST_ITEM: (propertyId: number | string) => `/user/wishlist/${propertyId}`,
  USER_CONTACTS: '/user/contacts',
  USER_HISTORY: '/user/history',
  USER_HISTORY_ITEM: (propertyId: number | string) => `/user/history/${propertyId}`,

  // Reviews
  REVIEWS: '/reviews',
  REVIEW_BY_TOKEN: (token: string) => `/reviews/token/${token}`,

  // Agent
  AGENT_DASHBOARD: '/agent/dashboard',
  AGENT_PROPERTIES: '/agent/properties',
  AGENT_CONTACTS: '/agent/contacts',
  AGENT_CONTACT_NOTE: (id: number | string) => `/agent/contacts/${id}/note`,
  AGENT_REVIEW_LINK: (propertyId: number | string) => `/agent/review-link/${propertyId}`,

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PENDING: '/admin/properties/pending',
  ADMIN_PROPERTY_APPROVE: (id: number | string) => `/admin/properties/${id}/approve`,
  ADMIN_AGENTS: '/admin/agents',
  ADMIN_AGENT_DETAIL: (id: number | string) => `/admin/agents/${id}`,
  ADMIN_AGENT_ROLE: (id: number | string) => `/admin/agents/${id}/role`,
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: (id: number | string) => `/admin/users/${id}`,
  ADMIN_REASSIGN: (bookingId: number | string) => `/admin/bookings/${bookingId}/reassign`,
  ADMIN_FINANCIAL: '/admin/financial',
  ADMIN_FINANCIAL_EXPORT: '/admin/financial/export',
} as const
