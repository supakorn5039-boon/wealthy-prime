import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { ApiResponse } from '@/types/Commons'
import type { GeocodeResult } from '@/types/Geocode'

export const GeocodeService = {
  resolveMapUrl: async (url: string): Promise<GeocodeResult> => {
    const res = await fetchClient.get<ApiResponse<GeocodeResult>>(API.GEOCODE_RESOLVE, {
      params: { url },
    })
    return res.data.data
  },
}
