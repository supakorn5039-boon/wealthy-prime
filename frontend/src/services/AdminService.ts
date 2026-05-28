import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { AuthUser } from '@/types/Auth'
import type { Property } from '@/types/Property'
import type { ApiResponse } from '@/types/Commons'

export interface AdminDashboardData {
  totalProperties: number
  totalUsers: number
  totalAgents: number
  totalRevenue: number
  propertyStatusChart: { status: string; count: number }[]
  agentLeaderboard: { agentId: number; agentName: string; closedCount: number }[]
}

export interface PendingApproval {
  id: number
  property: Property
  requestedStatus: string
  slipUrl?: string
  agentId: number
  agentName: string
  createdAt: string
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
    PENDING: 'admin-pending',
    AGENTS: 'admin-agents',
    USERS: 'admin-users',
    FINANCIAL: 'admin-financial',
  },

  getDashboard: async (): Promise<AdminDashboardData> => {
    const res = await fetchClient.get<ApiResponse<AdminDashboardData>>(API.ADMIN_DASHBOARD)
    return res.data.data
  },

  getPending: async (): Promise<PendingApproval[]> => {
    const res = await fetchClient.get<ApiResponse<PendingApproval[]>>(API.ADMIN_PENDING)
    return res.data.data
  },

  approvePending: async (id: number | string): Promise<void> => {
    await fetchClient.patch(API.ADMIN_PROPERTY_APPROVE(id), { action: 'approve' })
  },

  rejectPending: async (id: number | string): Promise<void> => {
    await fetchClient.patch(API.ADMIN_PROPERTY_APPROVE(id), { action: 'reject' })
  },

  getAgents: async (): Promise<AuthUser[]> => {
    const res = await fetchClient.get<ApiResponse<AuthUser[]>>(API.ADMIN_AGENTS)
    return res.data.data
  },

  updateAgent: async (id: number | string, payload: Partial<AuthUser>): Promise<AuthUser> => {
    const res = await fetchClient.patch<ApiResponse<AuthUser>>(API.ADMIN_AGENT_DETAIL(id), payload)
    return res.data.data
  },

  getUsers: async (): Promise<AuthUser[]> => {
    const res = await fetchClient.get<ApiResponse<AuthUser[]>>(API.ADMIN_USERS)
    return res.data.data
  },

  updateUser: async (id: number | string, payload: Partial<AuthUser>): Promise<AuthUser> => {
    const res = await fetchClient.patch<ApiResponse<AuthUser>>(API.ADMIN_USER_DETAIL(id), payload)
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
}
