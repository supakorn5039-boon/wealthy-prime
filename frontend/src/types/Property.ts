export type PropertyType = 'buy' | 'rent'
export type PropertyStatus = 'available' | 'pending_approve' | 'reserved' | 'sold'

export interface Property {
  id: number
  title: string
  projectName: string
  location: string
  price: number
  type: PropertyType
  sizeSqm?: number
  agentId?: number
  agentName?: string
  ownerInfo: string
  rentalPeriodMonths?: number
  slipUrl?: string
  status: PropertyStatus
  imageUrls?: string[]
  rating?: number
  reviewCount?: number
  lat?: number
  lng?: number
  createdAt: string
}

export interface PropertyListParams {
  search?: string
  type?: PropertyType
  minPrice?: number
  maxPrice?: number
  status?: PropertyStatus
  page?: number
  limit?: number
}

export interface CreatePropertyPayload {
  title: string
  projectName: string
  location: string
  price: number
  type: PropertyType
  sizeSqm?: number
  ownerInfo: string
  ownerExtraDetail?: string
  rentalPeriodMonths?: number
}

export interface UpdatePropertyStatusPayload {
  status: PropertyStatus
  slipFile?: File
  rentalPeriodMonths?: number
}

export interface EditPropertyPayload {
  title: string
  projectName: string
  location: string
  price: number
  type: PropertyType
  sizeSqm?: number
  ownerInfo: string
  rentalPeriodMonths?: number
}

export interface AgentDashboardStats {
  totalProperties: number
  reservedProperties: number
  availableProperties: number
}
