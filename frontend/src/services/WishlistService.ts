import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { Property } from '@/types/Property'
import type { ApiResponse } from '@/types/Commons'

const IS_MOCK = import.meta.env.VITE_MOCK_API === 'true'

export const WishlistService = {
  QUERY_KEYS: {
    LIST: 'wishlist',
  },

  list: async (): Promise<Property[]> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      return mockStore.getWishlist()
    }
    const res = await fetchClient.get<ApiResponse<Property[]>>(API.WISHLIST)
    return res.data.data
  },

  add: async (propertyId: number | string): Promise<void> => {
    if (IS_MOCK) {
      const { MOCK_PROPERTIES, mockStore } = await import('@/mocks/data')
      const property = MOCK_PROPERTIES.find(p => p.id === Number(propertyId))
      if (property) mockStore.addWishlist(property)
      return
    }
    await fetchClient.post(API.WISHLIST, { propertyId })
  },

  remove: async (propertyId: number | string): Promise<void> => {
    if (IS_MOCK) {
      const { mockStore } = await import('@/mocks/data')
      mockStore.removeWishlist(Number(propertyId))
      return
    }
    await fetchClient.delete(API.WISHLIST_ITEM(propertyId))
  },
}
