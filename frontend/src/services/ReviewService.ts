import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { Review, CreateReviewPayload } from '@/types/Review'
import type { ApiResponse } from '@/types/Commons'

export const ReviewService = {
  QUERY_KEYS: {
    PROPERTY_REVIEWS: 'property-reviews',
    TOKEN_REVIEW: 'token-review',
  },

  getByProperty: async (propertyId: number | string): Promise<Review[]> => {
    const res = await fetchClient.get<ApiResponse<Review[]>>(API.PROPERTY_REVIEWS(propertyId))
    return res.data.data
  },

  getByToken: async (token: string): Promise<{ propertyId: number; propertyTitle: string }> => {
    const res = await fetchClient.get<ApiResponse<{ propertyId: number; propertyTitle: string }>>(
      API.REVIEW_BY_TOKEN(token)
    )
    return res.data.data
  },

  create: async (payload: CreateReviewPayload): Promise<Review> => {
    const body = {
      property_id: payload.propertyId,
      rating: payload.rating,
      comment: payload.comment,
    }
    const res = await fetchClient.post<ApiResponse<Review>>(API.REVIEWS, body)
    return res.data.data
  },
}
