import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { AgentDashboardStats } from '@/types/Property'
import type { Booking } from '@/types/Booking'
import type { ReviewLink } from '@/types/Review'
import type { ApiResponse } from '@/types/Commons'

export interface ContactCase extends Booking {
  agentNote?: string
}

export const AgentService = {
  QUERY_KEYS: {
    DASHBOARD: 'agent-dashboard',
    CONTACTS: 'agent-contacts',
    REVIEW_LINKS: 'agent-review-links',
  },

  getDashboard: async (): Promise<AgentDashboardStats> => {
    const res = await fetchClient.get<ApiResponse<AgentDashboardStats>>(API.AGENT_DASHBOARD)
    return res.data.data
  },

  getContacts: async (): Promise<ContactCase[]> => {
    const res = await fetchClient.get<ApiResponse<ContactCase[]>>(API.AGENT_CONTACTS)
    return res.data.data
  },

  updateContactNote: async (contactId: number | string, note: string): Promise<void> => {
    await fetchClient.patch(API.AGENT_CONTACT_NOTE(contactId), { note })
  },

  generateReviewLink: async (propertyId: number | string): Promise<ReviewLink> => {
    const res = await fetchClient.get<ApiResponse<{ url: string }>>(API.AGENT_REVIEW_LINK(propertyId))
    return {
      token: '',
      url: res.data.data.url,
      propertyId: Number(propertyId),
      propertyTitle: '',
      expiresAt: '',
    }
  },

  getReviewLinks: async (): Promise<ReviewLink[]> => {
    return []
  },
}
