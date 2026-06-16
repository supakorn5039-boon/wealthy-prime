export interface Review {
  id: number
  propertyId: number
  propertyTitle?: string
  userId: number
  userName?: string
  rating: number
  comment?: string
  createdAt: string
  reply?: string
  repliedByName?: string
  repliedByRole?: 'user' | 'agent' | 'admin'
  repliedAt?: string
}

export interface CreateReviewPayload {
  propertyId: number
  rating: number
  comment?: string
  token: string
}

export interface CreateDirectReviewPayload {
  propertyId: number | string
  rating: number
  comment?: string
}

export interface ReplyReviewPayload {
  reviewId: number
  reply: string
}

export interface ReviewLink {
  token: string
  url: string
  propertyId: number
  propertyTitle: string
  expiresAt?: string
}
