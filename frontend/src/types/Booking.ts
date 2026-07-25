import type { ListingOwnerPreview, PropertyStatus } from '@/types/Property'

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
  propertyStatus?: PropertyStatus
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

  listingOwner?: ListingOwnerPreview
  propertyDocumentUrl?: string
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
  propertyPrice: number | null
  propertyType: 'buy' | 'rent'
  appointmentDate: Date | null
}
