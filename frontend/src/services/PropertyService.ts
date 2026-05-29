import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import { cleanParams } from '@/utils/serviceHelpers'
import type { Property, PropertyListParams, CreatePropertyPayload, UpdatePropertyStatusPayload, EditPropertyPayload } from '@/types/Property'
import type { ApiResponse, ApiListResponse } from '@/types/Commons'

export const PropertyService = {
  QUERY_KEYS: {
    LIST: 'properties',
    DETAIL: 'property-detail',
    REVIEWS: 'property-reviews',
    AGENT_LIST: 'agent-properties',
  },

  list: async (params?: PropertyListParams): Promise<ApiListResponse<Property>> => {
    const p = params ?? {}
    const queryParams = {
      type: p.type,
      search: p.search,
      min_price: p.minPrice,
      max_price: p.maxPrice,
    }
    const res = await fetchClient.get<ApiListResponse<Property>>(API.PROPERTIES, {
      params: cleanParams(queryParams as Record<string, unknown>),
    })
    return res.data
  },

  detail: async (id: number | string): Promise<Property> => {
    const res = await fetchClient.get<ApiResponse<Property>>(API.PROPERTY_DETAIL(id))
    return res.data.data
  },

  createWithImages: async (payload: CreatePropertyPayload, images: File[]): Promise<Property> => {
    const formData = new FormData()
    formData.append('title', payload.title)
    formData.append('project_name', payload.projectName)
    formData.append('location', payload.location)
    formData.append('price', String(payload.price))
    formData.append('type', payload.type)
    formData.append('owner_info', payload.ownerInfo)
    if (payload.sizeSqm !== undefined && payload.sizeSqm !== null) {
      formData.append('size_sqm', String(payload.sizeSqm))
    }
    if (payload.rentalPeriodMonths !== undefined && payload.rentalPeriodMonths !== null) {
      formData.append('rental_period_months', String(payload.rentalPeriodMonths))
    }
    images.forEach((img) => formData.append('images', img))
    const res = await fetchClient.post<ApiResponse<Property>>(API.AGENT_PROPERTIES, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  edit: async (id: number | string, payload: EditPropertyPayload, newImages: File[] = []): Promise<Property> => {
    const formData = new FormData()
    formData.append('title', payload.title)
    formData.append('project_name', payload.projectName)
    formData.append('location', payload.location)
    formData.append('price', String(payload.price))
    formData.append('type', payload.type)
    formData.append('owner_info', payload.ownerInfo)
    if (payload.sizeSqm !== undefined && payload.sizeSqm !== null) {
      formData.append('size_sqm', String(payload.sizeSqm))
    }
    if (payload.rentalPeriodMonths !== undefined && payload.rentalPeriodMonths !== null) {
      formData.append('rental_period_months', String(payload.rentalPeriodMonths))
    }
    newImages.forEach((img) => formData.append('images', img))
    const res = await fetchClient.patch<ApiResponse<Property>>(API.AGENT_PROPERTY_DETAIL(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  updateStatus: async (id: number | string, payload: UpdatePropertyStatusPayload): Promise<Property> => {
    const formData = new FormData()
    formData.append('status', payload.status)
    if (payload.slipFile) formData.append('slip', payload.slipFile)
    if (payload.rentalPeriodMonths) formData.append('rental_period_months', String(payload.rentalPeriodMonths))
    const res = await fetchClient.patch<ApiResponse<Property>>(API.AGENT_PROPERTY_STATUS(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  delete: async (id: number | string): Promise<void> => {
    await fetchClient.delete(API.AGENT_PROPERTY_DETAIL(id))
  },

  getAgentProperties: async (): Promise<Property[]> => {
    const res = await fetchClient.get<ApiResponse<Property[]>>(API.AGENT_PROPERTIES)
    return res.data.data
  },
}
