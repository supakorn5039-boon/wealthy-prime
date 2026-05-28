import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import { cleanParams } from '@/utils/serviceHelpers'
import type { Property, PropertyListParams, CreatePropertyPayload, UpdatePropertyStatusPayload } from '@/types/Property'
import type { ApiResponse, ApiListResponse } from '@/types/Commons'

export const PropertyService = {
  QUERY_KEYS: {
    LIST: 'properties',
    DETAIL: 'property-detail',
    REVIEWS: 'property-reviews',
    AGENT_LIST: 'agent-properties',
  },

  list: async (params?: PropertyListParams): Promise<ApiListResponse<Property>> => {
    const res = await fetchClient.get<ApiListResponse<Property>>(API.PROPERTIES, {
      params: cleanParams((params ?? {}) as Record<string, unknown>),
    })
    return res.data
  },

  detail: async (id: number | string): Promise<Property> => {
    const res = await fetchClient.get<ApiResponse<Property>>(API.PROPERTY_DETAIL(id))
    return res.data.data
  },

  create: async (payload: CreatePropertyPayload): Promise<Property> => {
    const res = await fetchClient.post<ApiResponse<Property>>(API.PROPERTIES, payload)
    return res.data.data
  },

  createWithImages: async (payload: CreatePropertyPayload, images: File[]): Promise<Property> => {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined && val !== null) formData.append(key, String(val))
    })
    images.forEach((img) => formData.append('images', img))
    const res = await fetchClient.post<ApiResponse<Property>>(API.PROPERTIES, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  updateStatus: async (id: number | string, payload: UpdatePropertyStatusPayload): Promise<Property> => {
    const formData = new FormData()
    formData.append('status', payload.status)
    if (payload.slipFile) formData.append('slip', payload.slipFile)
    if (payload.rentalPeriodMonths) formData.append('rentalPeriodMonths', String(payload.rentalPeriodMonths))
    const res = await fetchClient.patch<ApiResponse<Property>>(API.PROPERTY_STATUS(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  delete: async (id: number | string): Promise<void> => {
    await fetchClient.delete(API.PROPERTY_DETAIL(id))
  },

  getAgentProperties: async (): Promise<Property[]> => {
    const res = await fetchClient.get<ApiResponse<Property[]>>(API.AGENT_PROPERTIES)
    return res.data.data
  },
}
