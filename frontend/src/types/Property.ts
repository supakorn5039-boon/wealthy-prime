export type PropertyType = 'buy' | 'rent'
export type ListingFilter = 'sell' | 'rent' | 'both'
export type PropertyStatus =
  | 'available'
  | 'reserved'
  | 'sold'
  | 'unavailable'
  | 'owner_update'
export type PropertyKind =
  | 'condo'
  | 'studio'
  | 'house'
  | 'semi_detached_house'
  | 'townhouse'
  | 'home_office'
  | 'commercial'
  | 'office'
  | 'shop'
  | 'warehouse'
  | 'land'
  | 'hotel'
  | 'apartment'
  | ''
export type ListingType = 'rent' | 'sell' | 'both' | ''
export type PetPolicy = 'allowed' | 'not_allowed' | ''
export type FurniturePolicy = 'full' | 'partial' | 'none' | ''

export interface PropertyImage {
  id: number
  url: string
}

export interface ListingOwnerPreview {
  info: string
  name: string
  phone: string
  email: string
  lineId: string
  facebook: string
  wechat: string
  whatsapp: string
}

export interface Property {
  id: number
  propertyCode?: string
  projectName: string
  location: string
  rentPrice?: number | null
  salePrice?: number | null
  type: PropertyType
  kind?: PropertyKind
  listing?: ListingType
  province?: string
  district?: string
  googleMapUrl?: string
  btsMrt?: number[]
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
  ownerDocumentUrl?: string
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
  searchStationIds?: number[]
  types?: ListingFilter[]
  kinds?: PropertyKind[]
  provinces?: string[]
  districts?: string[]
  priceRanges?: { min?: number; max?: number }[]

  btsMrtIds?: number[]
  pets?: PetPolicy[]
  minBedrooms?: number
  maxBedrooms?: number
  bathrooms?: number
  sizeMin?: number
  sizeMax?: number
  floorMin?: number
  floorMax?: number
  status?: PropertyStatus
  statuses?: PropertyStatus[]
  projectName?: string
  agentId?: number
  createdFrom?: string
  createdTo?: string
  page?: number
  limit?: number
}

export interface PropertyFormFields {
  projectName: string
  location: string
  rentPrice?: number
  salePrice?: number
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
  ownerDocumentUrl?: string
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
  sellListings: number
  rentListings: number
  bothListings: number
}
