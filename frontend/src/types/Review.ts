export interface Review {
  id: number
  propertyId: number
  propertyTitle?: string
  userId: number
  userName?: string
  rating: number
  comment?: string
  createdAt: string
}

export interface CreateReviewPayload {
  propertyId: number
  rating: number
  comment?: string
  token: string
}

export interface ReviewLink {
  token: string
  url: string
  propertyId: number
  propertyTitle: string
  expiresAt?: string
}
