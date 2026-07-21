import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import { cleanParams } from '@/utils/serviceHelpers'
import type { Property, PropertyListParams, CreatePropertyPayload, UpdatePropertyStatusPayload, EditPropertyPayload, PropertyFormFields, ListingOwnerPreview } from '@/types/Property'
import type { ApiResponse, ApiListResponse } from '@/types/Commons'

function appendCommonFields(fd: FormData, payload: PropertyFormFields) {
  fd.append('project_name', payload.projectName)
  fd.append('location', payload.location ?? '')
  if (payload.rentPrice != null) fd.append('rent_price', String(payload.rentPrice))
  if (payload.salePrice != null) fd.append('sale_price', String(payload.salePrice))
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
  if (payload.ownerDocumentUrl) fd.append('owner_document_url', payload.ownerDocumentUrl)
}

export const PropertyService = {
  QUERY_KEYS: {
    LIST: 'properties',
    DETAIL: 'property-detail',
    AGENT_LIST: 'agent-properties',
    SUGGEST: 'property-name-suggest',
  },

  list: async (params?: PropertyListParams): Promise<ApiListResponse<Property>> => {
    const p = params ?? {}
    const csv = (xs?: (string | number)[]) =>
      xs && xs.length > 0 ? xs.join(',') : undefined

    const priceRangesCsv = p.priceRanges && p.priceRanges.length > 0
      ? p.priceRanges.map((r) => `${r.min ?? ''}-${r.max ?? ''}`).join(',')
      : undefined
    const queryParams = {
      search: p.search,
      search_station_ids: csv(p.searchStationIds),
      types: csv(p.types),
      kinds: csv(p.kinds),
      provinces: csv(p.provinces),
      price_ranges: priceRangesCsv,
      bts_mrt_ids: csv(p.btsMrtIds),
      pets: csv(p.pets),
      statuses: csv(p.statuses),
      min_bedrooms: p.minBedrooms,
      bathrooms: p.bathrooms,
      size_min: p.sizeMin,
      size_max: p.sizeMax,
      floor_min: p.floorMin,
      floor_max: p.floorMax,
      project_name: p.projectName,
      agent_id: p.agentId,
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

  suggestProjectNames: async (q: string): Promise<string[]> => {
    const res = await fetchClient.get<ApiResponse<string[]>>(API.PROPERTY_SUGGEST, {
      params: { q },
    })
    return res.data.data ?? []
  },

  downloadImagesArchive: async (id: number | string): Promise<Blob> => {
    const res = await fetchClient.get<Blob>(API.PROPERTY_IMAGES_ARCHIVE(id), {
      responseType: 'blob',
    })
    return res.data
  },

  getListingOwner: async (id: number | string): Promise<ListingOwnerPreview | null> => {
    const res = await fetchClient.get<ApiResponse<ListingOwnerPreview | null>>(
      API.PROPERTY_LISTING_OWNER(id),
    )
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

  getAgentProperties: async (params?: PropertyListParams): Promise<Property[]> => {
    const p = params ?? {}
    const csv = (xs?: (string | number)[]) =>
      xs && xs.length > 0 ? xs.join(',') : undefined
    const queryParams = {
      search: p.search,
      types: csv(p.types),
      kinds: csv(p.kinds),
      statuses: csv(p.statuses),
      project_name: p.projectName,
    }
    const res = await fetchClient.get<ApiResponse<Property[]>>(API.AGENT_PROPERTIES, {
      params: cleanParams(queryParams as Record<string, unknown>),
    })
    return res.data.data
  },

  getAdminProperties: async (params?: PropertyListParams): Promise<Property[]> => {
    const p = params ?? {}
    const csv = (xs?: (string | number)[]) =>
      xs && xs.length > 0 ? xs.join(',') : undefined
    const queryParams = {
      search: p.search,
      types: csv(p.types),
      kinds: csv(p.kinds),
      provinces: csv(p.provinces),
      bts_mrt_ids: csv(p.btsMrtIds),
      statuses: csv(p.statuses),
      project_name: p.projectName,
      agent_id: p.agentId,
    }
    const res = await fetchClient.get<ApiResponse<Property[]>>(API.ADMIN_PROPERTIES, {
      params: cleanParams(queryParams as Record<string, unknown>),
    })
    return res.data.data
  },
}
