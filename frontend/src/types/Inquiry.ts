export type InquiryStatus = 'new' | 'contacted'

export interface Inquiry {
  id: number
  userId: number
  userName?: string
  userEmail?: string
  propertyId: number
  propertyTitle?: string
  agentId?: number
  agentName?: string
  name: string
  phone: string
  message?: string
  status: InquiryStatus
  createdAt: string
}
