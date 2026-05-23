export type BookingStatus = 'pending' | 'assigned' | 'completed' | 'cancelled'

export interface Booking {
  id: number
  userId: number
  userName?: string
  userPhone?: string
  userLineId?: string
  propertyId: number
  propertyTitle?: string
  appointmentDate: string
  note?: string
  agentNote?: string
  status: BookingStatus
  assignedAgentId?: number
  assignedAgentName?: string
  createdAt: string
}

export interface CreateBookingPayload {
  propertyId: number
  appointmentDate: string
  note?: string
}

export interface CartItem {
  propertyId: number
  propertyTitle: string
  propertyPrice: number
  propertyType: 'buy' | 'rent'
  appointmentDate: Date | null
}
