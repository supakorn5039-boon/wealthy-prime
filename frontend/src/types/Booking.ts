export type BookingStatus = 'pending' | 'assigned' | 'completed' | 'cancelled'

export type AppointmentWorkStatus =
  | ''
  | 'contacted'
  | 'visited'
  | 'booked'
  | 'closed_deal'
  | 'customer_cancelled'

export interface Booking {
  id: number
  userId: number
  userName?: string
  userPhone?: string
  propertyId: number
  propertyTitle?: string
  propertyCode?: string
  appointmentDate: string
  note?: string
  status: BookingStatus
  workStatus?: AppointmentWorkStatus
  assignedAgentId?: number
  agentName?: string
  firstName?: string
  lastName?: string
  phone?: string
  secondaryPhone?: string
  latestContact?: string
  lineId?: string
  email?: string
  facebook?: string
  wechat?: string
  whatsapp?: string
  createdAt: string
  // Populated by the backend only when the viewing agent was assigned a
  // booking on a listing owned by a different agent. Lets the assignee
  // contact the listing agent for unit-specific questions.
  listingAgent?: ListingAgentPreview
}

export interface ListingAgentPreview {
  id: number
  name: string
  phone?: string
  email?: string
  lineId?: string
  facebook?: string
  wechat?: string
  whatsapp?: string
}

export interface CreateBookingPayload {
  propertyId: number
  appointmentDate: string
  note?: string
  firstName?: string
  lastName?: string
  phone?: string
  secondaryPhone?: string
  latestContact?: string
  lineId?: string
  email?: string
  facebook?: string
  wechat?: string
  whatsapp?: string
}

export interface CartItem {
  propertyId: number
  propertyTitle: string
  propertyPrice: number
  propertyType: 'buy' | 'rent'
  appointmentDate: Date | null
}
