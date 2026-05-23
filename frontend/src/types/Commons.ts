export interface ApiMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success?: boolean
}

export interface ApiListResponse<T> {
  data: T[]
  meta: ApiMeta
  message?: string
  success?: boolean
}
