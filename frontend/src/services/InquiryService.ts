import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { Inquiry, InquiryStatus, CreateInquiryInput } from '@/types/Inquiry'
import type { ApiResponse } from '@/types/Commons'

export const InquiryService = {
  QUERY_KEYS: {
    AGENT_INQUIRIES: 'agent-inquiries',
  },

  create: async (input: CreateInquiryInput): Promise<Inquiry> => {
    const res = await fetchClient.post<ApiResponse<Inquiry>>(API.USER_INQUIRIES, input)
    return res.data.data
  },

  getAgentInquiries: async (): Promise<Inquiry[]> => {
    const res = await fetchClient.get<ApiResponse<Inquiry[]>>(API.AGENT_INQUIRIES)
    return res.data.data
  },

  updateStatus: async (id: number | string, status: InquiryStatus): Promise<Inquiry> => {
    const res = await fetchClient.patch<ApiResponse<Inquiry>>(API.AGENT_INQUIRY_STATUS(id), { status })
    return res.data.data
  },
}
