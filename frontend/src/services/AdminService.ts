import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { AuthUser } from '@/types/Auth'
import type { Property } from '@/types/Property'
import type { ApiResponse } from '@/types/Commons'

const IS_MOCK = import.meta.env.VITE_MOCK_API === 'true'

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
    if (IS_MOCK) {
      const { MOCK_ADMIN_DASHBOARD } = await import('@/mocks/data')
      return MOCK_ADMIN_DASHBOARD
    }
    const res = await fetchClient.get<ApiResponse<AdminDashboardData>>(API.ADMIN_DASHBOARD)
    return res.data.data
  },

  getPending: async (): Promise<PendingApproval[]> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      return mockStore.getPending()
    }
    const res = await fetchClient.get<ApiResponse<PendingApproval[]>>(API.ADMIN_PENDING)
    return res.data.data
  },

  approvePending: async (id: number | string): Promise<void> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      mockStore.removePending(Number(id))
      return
    }
    await fetchClient.post(API.ADMIN_PENDING_APPROVE(id))
  },

  rejectPending: async (id: number | string): Promise<void> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      mockStore.removePending(Number(id))
      return
    }
    await fetchClient.post(API.ADMIN_PENDING_REJECT(id))
  },

  getAgents: async (): Promise<AuthUser[]> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      return mockStore.getAgents()
    }
    const res = await fetchClient.get<ApiResponse<AuthUser[]>>(API.ADMIN_AGENTS)
    return res.data.data
  },

  updateAgent: async (id: number | string, payload: Partial<AuthUser>): Promise<AuthUser> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      return mockStore.updateAgent(Number(id), payload)
    }
    const res = await fetchClient.patch<ApiResponse<AuthUser>>(API.ADMIN_AGENT_DETAIL(id), payload)
    return res.data.data
  },

  getUsers: async (): Promise<AuthUser[]> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      return mockStore.getUsers()
    }
    const res = await fetchClient.get<ApiResponse<AuthUser[]>>(API.ADMIN_USERS)
    return res.data.data
  },

  updateUser: async (id: number | string, payload: Partial<AuthUser>): Promise<AuthUser> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      return mockStore.updateUser(Number(id), payload)
    }
    const res = await fetchClient.patch<ApiResponse<AuthUser>>(API.ADMIN_USER_DETAIL(id), payload)
    return res.data.data
  },

  reassignCase: async (bookingId: number | string, newAgentId: number | string): Promise<void> => {
    if (IS_MOCK) return
    await fetchClient.post(API.ADMIN_REASSIGN, { bookingId, newAgentId })
  },

  getFinancial: async (): Promise<FinancialRecord[]> => {
    if (IS_MOCK) {
      const { MOCK_FINANCIAL } = await import('@/mocks/data')
      return MOCK_FINANCIAL
    }
    const res = await fetchClient.get<ApiResponse<FinancialRecord[]>>(API.ADMIN_FINANCIAL)
    return res.data.data
  },

  exportFinancial: async (): Promise<Blob> => {
    if (IS_MOCK) {
      const { MOCK_FINANCIAL } = await import('@/mocks/data')
      const csv = ['Property,Agent,Amount,Type,Date', ...MOCK_FINANCIAL.map(r =>
        `${r.propertyTitle},${r.agentName},${r.amount},${r.type},${r.closedAt}`
      )].join('\n')
      return new Blob([csv], { type: 'text/csv' })
    }
    const res = await fetchClient.get(API.ADMIN_FINANCIAL_EXPORT, { responseType: 'blob' })
    return res.data as Blob
  },
}
