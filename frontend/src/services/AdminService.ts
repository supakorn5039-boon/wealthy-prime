import { fetchClient } from '@/utils/axios'
import { cleanParams } from '@/utils/serviceHelpers'
import { API } from '@/constants/ApiRoutes'
import type { AuthUser } from '@/types/Auth'
import type { Booking } from '@/types/Booking'
import type { ApiResponse } from '@/types/Commons'
import type { AuditLog, AuditLogFilters } from '@/types/AuditLog'

export interface AdminDashboardData {
  totalProperties: number
  totalUsers: number
  totalAgents: number
  totalRevenue: number
  propertyStatusChart: { status: string; count: number }[]
  agentLeaderboard: { agentId: number; agentName: string; closedCount: number }[]
}

export interface FinancialRecord {
  id: number
  propertyId: number
  propertyTitle: string
  agentName: string
  amount: number
  type: 'buy' | 'rent'
  closedAt: string
}

export const AdminService = {
  QUERY_KEYS: {
    DASHBOARD: 'admin-dashboard',
    PENDING_USERS: 'admin-pending-users',
    AGENTS: 'admin-agents',
    USERS: 'admin-users',
    BOOKINGS: 'admin-bookings',
    FINANCIAL: 'admin-financial',
    AUDIT_LOGS: 'admin-audit-logs',
  },

  getDashboard: async (): Promise<AdminDashboardData> => {
    const res = await fetchClient.get<ApiResponse<AdminDashboardData>>(API.ADMIN_DASHBOARD)
    return res.data.data
  },

  getAgents: async (): Promise<AuthUser[]> => {
    const res = await fetchClient.get<ApiResponse<AuthUser[]>>(API.ADMIN_AGENTS)
    return res.data.data
  },

  updateAgent: async (id: number | string, payload: Partial<AuthUser>): Promise<AuthUser> => {
    const res = await fetchClient.put<ApiResponse<AuthUser>>(API.ADMIN_AGENT_DETAIL(id), payload)
    return res.data.data
  },

  getUsers: async (): Promise<AuthUser[]> => {
    const res = await fetchClient.get<ApiResponse<AuthUser[]>>(API.ADMIN_USERS)
    return res.data.data
  },

  getPendingUsers: async (): Promise<AuthUser[]> => {
    const res = await fetchClient.get<ApiResponse<AuthUser[]>>(API.ADMIN_PENDING_USERS)
    return res.data.data
  },

  approveUser: async (id: number | string): Promise<void> => {
    await fetchClient.put(API.ADMIN_USER_APPROVE(id))
  },

  rejectUser: async (id: number | string): Promise<void> => {
    await fetchClient.put(API.ADMIN_USER_REJECT(id))
  },

  updateUser: async (id: number | string, payload: Partial<AuthUser>): Promise<AuthUser> => {
    const res = await fetchClient.put<ApiResponse<AuthUser>>(API.ADMIN_USER_DETAIL(id), payload)
    return res.data.data
  },

  listBookings: async (): Promise<Booking[]> => {
    const res = await fetchClient.get<ApiResponse<Booking[]>>(API.ADMIN_BOOKINGS)
    return res.data.data
  },

  reassignCase: async (bookingId: number | string, newAgentId: number | string): Promise<void> => {
    await fetchClient.post(API.ADMIN_REASSIGN(bookingId), { agent_id: Number(newAgentId) })
  },

  getFinancial: async (): Promise<FinancialRecord[]> => {
    const res = await fetchClient.get<ApiResponse<FinancialRecord[]>>(API.ADMIN_FINANCIAL)
    return res.data.data
  },

  exportFinancial: async (): Promise<Blob> => {
    const res = await fetchClient.get(API.ADMIN_FINANCIAL_EXPORT, { responseType: 'blob' })
    return res.data as Blob
  },

  listAuditLogs: async (filters: AuditLogFilters = {}): Promise<AuditLog[]> => {
    const params = cleanParams({
      actor_role: filters.actorRole,
      action: filters.action,
      entity_type: filters.entityType,
      search: filters.search,
      limit: filters.limit,
      offset: filters.offset,
    })
    const res = await fetchClient.get<ApiResponse<AuditLog[]>>(API.ADMIN_AUDIT_LOGS, { params })
    return res.data.data ?? []
  },
}
