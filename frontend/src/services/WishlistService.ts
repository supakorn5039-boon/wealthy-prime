import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { Property } from '@/types/Property'
import type { ApiResponse } from '@/types/Commons'

export const WishlistService = {
  QUERY_KEYS: {
    LIST: 'wishlist',
  },

  list: async (): Promise<Property[]> => {
    const res = await fetchClient.get<ApiResponse<Property[]>>(API.WISHLIST)
    return res.data.data
  },

  add: async (propertyId: number | string): Promise<void> => {
    await fetchClient.post(API.WISHLIST, { propertyId })
  },

  remove: async (propertyId: number | string): Promise<void> => {
    await fetchClient.delete(API.WISHLIST_ITEM(propertyId))
  },
}
