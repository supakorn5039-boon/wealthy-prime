import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import { cleanParams } from '@/utils/serviceHelpers'
import type { Property, PropertyListParams, CreatePropertyPayload, UpdatePropertyStatusPayload, EditPropertyPayload, PropertyFormFields } from '@/types/Property'
import type { ApiResponse, ApiListResponse } from '@/types/Commons'

function appendCommonFields(fd: FormData, payload: PropertyFormFields) {
  fd.append('title', payload.title)
  fd.append('project_name', payload.projectName)
  fd.append('location', payload.location ?? '')
  fd.append('price', String(payload.price))
  fd.append('owner_info', payload.ownerInfo)
  if (payload.sizeSqm != null) fd.append('size_sqm', String(payload.sizeSqm))
  if (payload.lat != null) fd.append('lat', String(payload.lat))
  if (payload.lng != null) fd.append('lng', String(payload.lng))

  if (payload.kind) fd.append('kind', payload.kind)
  if (payload.listing) fd.append('listing', payload.listing)
  if (payload.province) fd.append('province', payload.province)
  if (payload.district) fd.append('district', payload.district)
  if (payload.googleMapUrl) fd.append('google_map_url', payload.googleMapUrl)
  if (payload.btsMrt) fd.append('bts_mrt', payload.btsMrt)
  if (payload.bedrooms != null) fd.append('bedrooms', String(payload.bedrooms))
  if (payload.bathrooms != null) fd.append('bathrooms', String(payload.bathrooms))
  if (payload.floor != null) fd.append('floor', String(payload.floor))
  if (payload.minContract != null) fd.append('min_contract', String(payload.minContract))
  if (payload.pets) fd.append('pets', payload.pets)
  if (payload.furniture) fd.append('furniture', payload.furniture)
  if (payload.adCaption) fd.append('ad_caption', payload.adCaption)

  if (payload.ownerName) fd.append('owner_name', payload.ownerName)
  if (payload.ownerPhone) fd.append('owner_phone', payload.ownerPhone)
  if (payload.ownerLineId) fd.append('owner_line_id', payload.ownerLineId)
  if (payload.ownerEmail) fd.append('owner_email', payload.ownerEmail)
  if (payload.ownerFacebook) fd.append('owner_facebook', payload.ownerFacebook)
  if (payload.ownerWechat) fd.append('owner_wechat', payload.ownerWechat)
  if (payload.ownerWhatsapp) fd.append('owner_whatsapp', payload.ownerWhatsapp)
}

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
      kind: p.kind,
      province: p.province,
      district: p.district,
      bts_mrt_ids: p.btsMrtIds && p.btsMrtIds.length > 0 ? p.btsMrtIds.join(',') : undefined,
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
    appendCommonFields(formData, payload)
    images.forEach((img) => formData.append('images', img))
    const res = await fetchClient.post<ApiResponse<Property>>(API.AGENT_PROPERTIES, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  edit: async (id: number | string, payload: EditPropertyPayload, newImages: File[] = []): Promise<Property> => {
    const formData = new FormData()
    appendCommonFields(formData, payload)
    if (payload.deleteImageIds && payload.deleteImageIds.length > 0) {
      formData.append('delete_image_ids', payload.deleteImageIds.join(','))
    }
    newImages.forEach((img) => formData.append('images', img))
    const res = await fetchClient.put<ApiResponse<Property>>(API.AGENT_PROPERTY_DETAIL(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  updateStatus: async (id: number | string, payload: UpdatePropertyStatusPayload): Promise<Property> => {
    const formData = new FormData()
    formData.append('status', payload.status)
    const res = await fetchClient.put<ApiResponse<Property>>(API.AGENT_PROPERTY_STATUS(id), formData, {
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
