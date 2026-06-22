import { Suspense } from 'react'
import { ROUTES, RouteLayout } from '@/constants/Routes'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import lazyWithReload from '@/utils/lazyWithReload'
import type { UserRole } from '@/types/Auth'

const MapIndex = lazyWithReload(() => import('@/pages/map/MapIndex'))
const LoginIndex = lazyWithReload(() => import('@/pages/login/LoginIndex'))
const RegisterIndex = lazyWithReload(() => import('@/pages/register/RegisterIndex'))
const ForgotPasswordIndex = lazyWithReload(() => import('@/pages/forgot-password/ForgotPasswordIndex'))
const ResetPasswordIndex = lazyWithReload(() => import('@/pages/reset-password/ResetPasswordIndex'))
const HomeIndex = lazyWithReload(() => import('@/pages/home/HomeIndex'))
const PropertyDetailIndex = lazyWithReload(() => import('@/pages/property/PropertyDetailIndex'))
const ReviewIndex = lazyWithReload(() => import('@/pages/review/ReviewIndex'))
const ProfileIndex = lazyWithReload(() => import('@/pages/user/ProfileIndex'))
const WishlistIndex = lazyWithReload(() => import('@/pages/user/WishlistIndex'))
const HistoryIndex = lazyWithReload(() => import('@/pages/user/HistoryIndex'))
const ContactsIndex = lazyWithReload(() => import('@/pages/user/ContactsIndex'))
const AgentDashboardIndex = lazyWithReload(() => import('@/pages/agent/AgentDashboardIndex'))
const MyPropertiesIndex = lazyWithReload(() => import('@/pages/agent/MyPropertiesIndex'))
const AddPropertyIndex = lazyWithReload(() => import('@/pages/agent/AddPropertyIndex'))
const ContactHistoryIndex = lazyWithReload(() => import('@/pages/agent/ContactHistoryIndex'))
const InquiriesIndex = lazyWithReload(() => import('@/pages/agent/InquiriesIndex'))
const ReviewLinkIndex = lazyWithReload(() => import('@/pages/agent/ReviewLinkIndex'))
const LeadsIndex = lazyWithReload(() => import('@/pages/agent/LeadsIndex'))
const AgentProfileIndex = lazyWithReload(() => import('@/pages/agent/AgentProfileIndex'))
const AgentOverviewIndex = lazyWithReload(() => import('@/pages/agent/AgentOverviewIndex'))
const OwnerLogIndex = lazyWithReload(() => import('@/pages/agent/OwnerLogIndex'))
const AdminDashboardIndex = lazyWithReload(() => import('@/pages/admin/AdminDashboardIndex'))
const PendingUsersIndex = lazyWithReload(() => import('@/pages/admin/PendingUsersIndex'))
const AgentManagementIndex = lazyWithReload(() => import('@/pages/admin/AgentManagementIndex'))
const UserManagementIndex = lazyWithReload(() => import('@/pages/admin/UserManagementIndex'))
const CaseReassignmentIndex = lazyWithReload(() => import('@/pages/admin/CaseReassignmentIndex'))
const AdminVisitRequestsIndex = lazyWithReload(() => import('@/pages/admin/VisitRequestsIndex'))
const FinancialIndex = lazyWithReload(() => import('@/pages/admin/FinancialIndex'))

function wrap(element: React.ReactElement) {
  return <Suspense fallback={<LoadingSpinner />}>{element}</Suspense>
}

export interface AppRoute {
  path: string
  element: React.ReactNode
  layout: RouteLayout
  allowedRoles?: UserRole[]
}

const USER_ONLY: UserRole[] = ['user']
const AGENT_ONLY: UserRole[] = ['agent']
const ADMIN_ONLY: UserRole[] = ['admin']

export const routes: AppRoute[] = [
  { path: ROUTES.HOME, element: wrap(<HomeIndex />), layout: RouteLayout.PUBLIC },
  { path: ROUTES.MAP, element: wrap(<MapIndex />), layout: RouteLayout.PUBLIC },
  { path: ROUTES.LOGIN, element: wrap(<LoginIndex />), layout: RouteLayout.BLANK },
  { path: ROUTES.REGISTER, element: wrap(<RegisterIndex />), layout: RouteLayout.BLANK },
  { path: ROUTES.FORGOT_PASSWORD, element: wrap(<ForgotPasswordIndex />), layout: RouteLayout.BLANK },
  { path: ROUTES.RESET_PASSWORD, element: wrap(<ResetPasswordIndex />), layout: RouteLayout.BLANK },
  { path: ROUTES.PROPERTY_DETAIL, element: wrap(<PropertyDetailIndex />), layout: RouteLayout.PUBLIC },
  { path: ROUTES.REVIEW, element: wrap(<ReviewIndex />), layout: RouteLayout.BLANK },

  // Personal info — available to all authenticated roles
  { path: ROUTES.PROFILE, element: wrap(<ProfileIndex />), layout: RouteLayout.PROTECTED },

  // User protected
  { path: ROUTES.WISHLIST, element: wrap(<WishlistIndex />), layout: RouteLayout.PROTECTED, allowedRoles: USER_ONLY },
  { path: ROUTES.HISTORY, element: wrap(<HistoryIndex />), layout: RouteLayout.PROTECTED, allowedRoles: USER_ONLY },
  { path: ROUTES.CONTACTS, element: wrap(<ContactsIndex />), layout: RouteLayout.PROTECTED, allowedRoles: USER_ONLY },

  // Agent protected
  { path: ROUTES.AGENT_DASHBOARD, element: wrap(<AgentDashboardIndex />), layout: RouteLayout.PROTECTED, allowedRoles: AGENT_ONLY },
  // MyPropertiesIndex serves both: agents see only their own listings,
  // admins see ALL listings (route-level role check is broadened; the page
  // dispatches to the correct API based on the caller's role).
  { path: ROUTES.AGENT_PROPERTIES, element: wrap(<MyPropertiesIndex />), layout: RouteLayout.PROTECTED, allowedRoles: ['agent', 'admin'] },
  { path: ROUTES.AGENT_ADD_PROPERTY, element: wrap(<AddPropertyIndex />), layout: RouteLayout.PROTECTED, allowedRoles: AGENT_ONLY },
  { path: ROUTES.AGENT_CONTACT_HISTORY, element: wrap(<ContactHistoryIndex />), layout: RouteLayout.PROTECTED, allowedRoles: AGENT_ONLY },
  { path: ROUTES.AGENT_INQUIRIES, element: wrap(<InquiriesIndex />), layout: RouteLayout.PROTECTED, allowedRoles: AGENT_ONLY },
  { path: ROUTES.AGENT_REVIEW_LINK, element: wrap(<ReviewLinkIndex />), layout: RouteLayout.PROTECTED, allowedRoles: AGENT_ONLY },
  { path: ROUTES.AGENT_LEADS, element: wrap(<LeadsIndex />), layout: RouteLayout.PROTECTED, allowedRoles: AGENT_ONLY },
  { path: ROUTES.AGENT_PROFILE, element: wrap(<AgentProfileIndex />), layout: RouteLayout.PROTECTED, allowedRoles: AGENT_ONLY },
  { path: ROUTES.AGENT_OVERVIEW, element: wrap(<AgentOverviewIndex />), layout: RouteLayout.PROTECTED, allowedRoles: AGENT_ONLY },
  { path: ROUTES.AGENT_OWNER_LOG, element: wrap(<OwnerLogIndex />), layout: RouteLayout.PROTECTED, allowedRoles: AGENT_ONLY },

  // Admin protected
  { path: ROUTES.ADMIN_DASHBOARD, element: wrap(<AdminDashboardIndex />), layout: RouteLayout.PROTECTED, allowedRoles: ADMIN_ONLY },
  { path: ROUTES.ADMIN_PENDING_USERS, element: wrap(<PendingUsersIndex />), layout: RouteLayout.PROTECTED, allowedRoles: ADMIN_ONLY },
  { path: ROUTES.ADMIN_AGENTS, element: wrap(<AgentManagementIndex />), layout: RouteLayout.PROTECTED, allowedRoles: ADMIN_ONLY },
  { path: ROUTES.ADMIN_USERS, element: wrap(<UserManagementIndex />), layout: RouteLayout.PROTECTED, allowedRoles: ADMIN_ONLY },
  { path: ROUTES.ADMIN_REASSIGN, element: wrap(<CaseReassignmentIndex />), layout: RouteLayout.PROTECTED, allowedRoles: ADMIN_ONLY },
  { path: ROUTES.ADMIN_VISIT_REQUESTS, element: wrap(<AdminVisitRequestsIndex />), layout: RouteLayout.PROTECTED, allowedRoles: ADMIN_ONLY },
  { path: ROUTES.ADMIN_FINANCIAL, element: wrap(<FinancialIndex />), layout: RouteLayout.PROTECTED, allowedRoles: ADMIN_ONLY },
]
