import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { Inquiry, InquiryStatus } from '@/types/Inquiry'
import type { ApiResponse } from '@/types/Commons'

export const InquiryService = {
  QUERY_KEYS: {
    AGENT_INQUIRIES: 'agent-inquiries',
  },

  getAgentInquiries: async (): Promise<Inquiry[]> => {
    const res = await fetchClient.get<ApiResponse<Inquiry[]>>(API.AGENT_INQUIRIES)
    return res.data.data
  },

  updateStatus: async (id: number | string, status: InquiryStatus): Promise<Inquiry> => {
    const res = await fetchClient.put<ApiResponse<Inquiry>>(API.AGENT_INQUIRY_STATUS(id), { status })
    return res.data.data
  },
}
