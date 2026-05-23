import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import { cleanParams } from '@/utils/serviceHelpers'
import type { Property, PropertyListParams, CreatePropertyPayload, UpdatePropertyStatusPayload } from '@/types/Property'
import type { ApiResponse, ApiListResponse } from '@/types/Commons'

const IS_MOCK = import.meta.env.VITE_MOCK_API === 'true'

export const PropertyService = {
  QUERY_KEYS: {
    LIST: 'properties',
    DETAIL: 'property-detail',
    REVIEWS: 'property-reviews',
    AGENT_LIST: 'agent-properties',
  },

  list: async (params?: PropertyListParams): Promise<ApiListResponse<Property>> => {
    if (IS_MOCK) {
      const { MOCK_PROPERTIES } = await import('@/mocks/data')
      let items = [...MOCK_PROPERTIES]
      if (params?.search) {
        const q = params.search.toLowerCase()
        items = items.filter(p => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.projectName.toLowerCase().includes(q))
      }
      if (params?.type) items = items.filter(p => p.type === params.type)
      if (params?.minPrice) items = items.filter(p => p.price >= params.minPrice!)
      if (params?.maxPrice) items = items.filter(p => p.price <= params.maxPrice!)
      if (params?.status) items = items.filter(p => p.status === params.status)
      return { data: items, meta: { page: 1, limit: 20, total: items.length, totalPages: 1 } }
    }
    const res = await fetchClient.get<ApiListResponse<Property>>(API.PROPERTIES, {
      params: cleanParams((params ?? {}) as Record<string, unknown>),
    })
    return res.data
  },

  detail: async (id: number | string): Promise<Property> => {
    if (IS_MOCK) {
      const { MOCK_PROPERTIES } = await import('@/mocks/data')
      const p = MOCK_PROPERTIES.find(x => x.id === Number(id))
      if (!p) throw new Error('Property not found')
      return p
    }
    const res = await fetchClient.get<ApiResponse<Property>>(API.PROPERTY_DETAIL(id))
    return res.data.data
  },

  create: async (payload: CreatePropertyPayload): Promise<Property> => {
    if (IS_MOCK) {
      const { MOCK_PROPERTIES, MOCK_AGENT } = await import('@/mocks/data')
      const newProp: Property = {
        id: Date.now(),
        ...payload,
        agentId: MOCK_AGENT.id,
        agentName: MOCK_AGENT.name,
        status: 'available',
        images: [],
        createdAt: new Date().toISOString(),
      }
      MOCK_PROPERTIES.push(newProp)
      return newProp
    }
    const res = await fetchClient.post<ApiResponse<Property>>(API.PROPERTIES, payload)
    return res.data.data
  },

  createWithImages: async (payload: CreatePropertyPayload, images: File[]): Promise<Property> => {
    if (IS_MOCK) return PropertyService.create(payload)
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
    if (IS_MOCK) {
      const { MOCK_PROPERTIES } = await import('@/mocks/data')
      const idx = MOCK_PROPERTIES.findIndex(x => x.id === Number(id))
      if (idx !== -1) MOCK_PROPERTIES[idx] = { ...MOCK_PROPERTIES[idx], status: payload.status as Property['status'] }
      return MOCK_PROPERTIES[idx]
    }
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
    if (IS_MOCK) {
      const { MOCK_PROPERTIES } = await import('@/mocks/data')
      const idx = MOCK_PROPERTIES.findIndex(x => x.id === Number(id))
      if (idx !== -1) MOCK_PROPERTIES.splice(idx, 1)
      return
    }
    await fetchClient.delete(API.PROPERTY_DETAIL(id))
  },

  getAgentProperties: async (): Promise<Property[]> => {
    if (IS_MOCK) {
      const { MOCK_PROPERTIES } = await import('@/mocks/data')
      return MOCK_PROPERTIES
    }
    const res = await fetchClient.get<ApiResponse<Property[]>>(API.AGENT_PROPERTIES)
    return res.data.data
  },
}
