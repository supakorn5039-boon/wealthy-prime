import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type {
  Review,
  CreateReviewPayload,
  CreateDirectReviewPayload,
  ReplyReviewPayload,
} from '@/types/Review'
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
      token: payload.token,
      rating: payload.rating,
      comment: payload.comment,
    }
    const res = await fetchClient.post<ApiResponse<Review>>(API.REVIEWS, body)
    return res.data.data
  },

  createForProperty: async (payload: CreateDirectReviewPayload): Promise<Review> => {
    const res = await fetchClient.post<ApiResponse<Review>>(
      API.PROPERTY_CREATE_REVIEW(payload.propertyId),
      { rating: payload.rating, comment: payload.comment }
    )
    return res.data.data
  },

  reply: async (payload: ReplyReviewPayload): Promise<Review> => {
    const res = await fetchClient.patch<ApiResponse<Review>>(
      API.REVIEW_REPLY(payload.reviewId),
      { reply: payload.reply }
    )
    return res.data.data
  },
}
