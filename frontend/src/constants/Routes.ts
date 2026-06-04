export enum RouteLayout {
  PUBLIC = 'PUBLIC',
  BLANK = 'BLANK',
  PROTECTED = 'PROTECTED',
}

export const ROUTES = {
  HOME: '/',
  MAP: '/map',
  LOGIN: '/login',
  REGISTER: '/register',

  // Personal info (shared)
  PROFILE: '/profile',

  // User
  WISHLIST: '/wishlist',
  HISTORY: '/history',
  CONTACTS: '/contacts',

  // Property
  PROPERTY_DETAIL: '/property/:id',

  // Review (public token page)
  REVIEW: '/review/:token',

  // Agent
  AGENT_DASHBOARD: '/agent/dashboard',
  AGENT_PROPERTIES: '/agent/properties',
  AGENT_ADD_PROPERTY: '/agent/properties/add',
  AGENT_CONTACT_HISTORY: '/agent/contacts',
  AGENT_INQUIRIES: '/agent/inquiries',
  AGENT_REVIEW_LINK: '/agent/review-link',
  AGENT_LEADS: '/agent/leads',
  AGENT_PROFILE: '/agent/profile',
  AGENT_OVERVIEW: '/agent/overview',
  AGENT_OWNER_LOG: '/agent/owner-log',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PENDING: '/admin/pending',
  ADMIN_PENDING_USERS: '/admin/pending-users',
  ADMIN_AGENTS: '/admin/agents',
  ADMIN_USERS: '/admin/users',
  ADMIN_REASSIGN: '/admin/reassign',
  ADMIN_FINANCIAL: '/admin/financial',
} as const
