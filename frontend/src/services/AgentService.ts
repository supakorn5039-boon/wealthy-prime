import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { AgentDashboardStats } from '@/types/Property'
import type { Booking } from '@/types/Booking'
import type { ReviewLink } from '@/types/Review'
import type { ApiResponse } from '@/types/Commons'

const IS_MOCK = import.meta.env.VITE_MOCK_API === 'true'

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
    if (IS_MOCK) {
      const { MOCK_AGENT_DASHBOARD } = await import('@/mocks/data')
      return MOCK_AGENT_DASHBOARD
    }
    const res = await fetchClient.get<ApiResponse<AgentDashboardStats>>(API.AGENT_DASHBOARD)
    return res.data.data
  },

  getContacts: async (): Promise<ContactCase[]> => {
    if (IS_MOCK) {
      const { MOCK_AGENT_CONTACTS, mockStore } = await import('@/mocks/data')
      return MOCK_AGENT_CONTACTS.map(c => ({ ...c, agentNote: mockStore.getNote(c.id) }))
    }
    const res = await fetchClient.get<ApiResponse<ContactCase[]>>(API.AGENT_CONTACTS)
    return res.data.data
  },

  updateContactNote: async (contactId: number | string, note: string): Promise<void> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      mockStore.setNote(Number(contactId), note)
      return
    }
    await fetchClient.patch(API.AGENT_CONTACT_NOTE(contactId), { note })
  },

  generateReviewLink: async (propertyId: number | string): Promise<ReviewLink> => {
    if (IS_MOCK) {
      const { MOCK_PROPERTIES, mockStore } = await import('@/mocks/data')
      const property = MOCK_PROPERTIES.find(p => p.id === Number(propertyId))
      const token = Math.random().toString(36).slice(2, 12)
      const link: ReviewLink = {
        token,
        url: `${window.location.origin}/review/${token}`,
        propertyId: Number(propertyId),
        propertyTitle: property?.title ?? 'Unknown',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
      mockStore.addReviewLink(link)
      return link
    }
    const res = await fetchClient.post<ApiResponse<ReviewLink>>(API.AGENT_REVIEW_LINK, { propertyId })
    return res.data.data
  },

  getReviewLinks: async (): Promise<ReviewLink[]> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      return mockStore.getReviewLinks()
    }
    const res = await fetchClient.get<ApiResponse<ReviewLink[]>>(API.AGENT_REVIEW_LINK)
    return res.data.data
  },
}
