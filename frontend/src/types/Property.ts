export type PropertyType = 'buy' | 'rent'
export type PropertyStatus =
  | 'available'
  | 'pending_approve'
  | 'reserved'
  | 'sold'
  | 'unavailable'
  | 'owner_update'
export type PropertyKind = 'condo' | 'house' | 'townhouse' | ''
export type ListingType = 'rent' | 'sell' | 'both' | ''
export type PetPolicy = 'allowed' | 'not_allowed' | ''
export type FurniturePolicy = 'full' | 'partial' | 'none' | ''

export interface PropertyImage {
  id: number
  url: string
}

export interface Property {
  id: number
  propertyCode?: string
  title: string
  projectName: string
  location: string
  price: number
  type: PropertyType
  kind?: PropertyKind
  listing?: ListingType
  province?: string
  district?: string
  googleMapUrl?: string
  btsMrt?: string
  bedrooms?: number
  bathrooms?: number
  floor?: number
  minContract?: number
  pets?: PetPolicy
  furniture?: FurniturePolicy
  adCaption?: string
  sizeSqm?: number
  agentId?: number
  agentName?: string
  agentCode?: string
  ownerInfo: string
  ownerName?: string
  ownerPhone?: string
  ownerLineId?: string
  ownerEmail?: string
  ownerFacebook?: string
  ownerWechat?: string
  ownerWhatsapp?: string
  rentalPeriodMonths?: number
  slipUrl?: string
  status: PropertyStatus
  imageUrls?: string[]
  images?: PropertyImage[]
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

export interface PropertyFormFields {
  title: string
  projectName: string
  location: string
  price: number
  sizeSqm?: number
  ownerInfo: string
  ownerExtraDetail?: string
  lat?: number
  lng?: number

  kind?: PropertyKind
  listing?: ListingType
  province?: string
  district?: string
  googleMapUrl?: string
  btsMrt?: string
  bedrooms?: number
  bathrooms?: number
  floor?: number
  minContract?: number
  pets?: PetPolicy
  furniture?: FurniturePolicy
  adCaption?: string

  ownerName?: string
  ownerPhone?: string
  ownerLineId?: string
  ownerEmail?: string
  ownerFacebook?: string
  ownerWechat?: string
  ownerWhatsapp?: string
}

export type CreatePropertyPayload = PropertyFormFields

export interface UpdatePropertyStatusPayload {
  status: PropertyStatus
}

export interface EditPropertyPayload extends PropertyFormFields {
  deleteImageIds?: number[]
}

export interface AgentDashboardStats {
  totalProperties: number
  reservedProperties: number
  availableProperties: number
}
