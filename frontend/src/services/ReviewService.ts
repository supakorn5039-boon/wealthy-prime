import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { Review, CreateReviewPayload } from '@/types/Review'
import type { ApiResponse } from '@/types/Commons'

const IS_MOCK = import.meta.env.VITE_MOCK_API === 'true'

export const ReviewService = {
  QUERY_KEYS: {
    PROPERTY_REVIEWS: 'property-reviews',
    TOKEN_REVIEW: 'token-review',
  },

  getByProperty: async (propertyId: number | string): Promise<Review[]> => {
    if (IS_MOCK) {
      const { MOCK_REVIEWS } = await import('@/mocks/data')
      return MOCK_REVIEWS[Number(propertyId)] ?? []
    }
    const res = await fetchClient.get<ApiResponse<Review[]>>(API.PROPERTY_REVIEWS(propertyId))
    return res.data.data
  },

  getByToken: async (token: string): Promise<{ propertyId: number; propertyTitle: string }> => {
    if (IS_MOCK) {
      const { MOCK_REVIEW_LINKS } = await import('@/mocks/data')
      const link = MOCK_REVIEW_LINKS.find(l => l.token === token)
      if (!link) throw new Error('Invalid or expired link')
      return { propertyId: link.propertyId, propertyTitle: link.propertyTitle }
    }
    const res = await fetchClient.get<ApiResponse<{ propertyId: number; propertyTitle: string }>>(
      API.REVIEW_BY_TOKEN(token)
    )
    return res.data.data
  },

  create: async (payload: CreateReviewPayload): Promise<Review> => {
    if (IS_MOCK) {
      const { MOCK_REVIEWS, MOCK_USER } = await import('@/mocks/data')
      const review: Review = {
        id: Date.now(),
        propertyId: payload.propertyId,
        userId: MOCK_USER.id,
        userName: MOCK_USER.name,
        rating: payload.rating,
        comment: payload.comment,
        createdAt: new Date().toISOString(),
      }
      if (!MOCK_REVIEWS[payload.propertyId]) MOCK_REVIEWS[payload.propertyId] = []
      MOCK_REVIEWS[payload.propertyId].unshift(review)
      return review
    }
    const res = await fetchClient.post<ApiResponse<Review>>(API.REVIEWS, payload)
    return res.data.data
  },
}
