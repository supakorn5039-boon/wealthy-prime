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
  REGISTER_AGENT: '/register/agent',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  PROFILE: '/profile',

  WISHLIST: '/wishlist',
  HISTORY: '/history',
  CONTACTS: '/contacts',

  PROPERTY_DETAIL: '/property/:id',

  REVIEW: '/review/:token',

  AGENT_DASHBOARD: '/dashboard',
  AGENT_PROPERTIES: '/properties',
  AGENT_ADD_PROPERTY: '/properties/add',
  AGENT_CONTACT_HISTORY: '/visit-requests',
  AGENT_INQUIRIES: '/inquiries',
  AGENT_REVIEW_LINK: '/review-link',
  AGENT_LEADS: '/leads',
  AGENT_PROFILE: '/agent-profile',
  AGENT_OVERVIEW: '/agent-overview',

  ADMIN_DASHBOARD: '/dashboard',
  ADMIN_PENDING_USERS: '/pending-users',
  ADMIN_AGENTS: '/agents',
  ADMIN_USERS: '/users',
  ADMIN_REASSIGN: '/reassign',
  ADMIN_FINANCIAL: '/financial',
  ADMIN_AUDIT_LOGS: '/audit-logs',
} as const
