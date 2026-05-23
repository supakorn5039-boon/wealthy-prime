import type { ApiMeta } from '@/types/Commons'

export function cleanParams<T extends Record<string, unknown>>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

export function fallbackMeta(meta?: Partial<ApiMeta>): ApiMeta {
  return {
    page: meta?.page ?? 1,
    limit: meta?.limit ?? 20,
    total: meta?.total ?? 0,
    totalPages: meta?.totalPages ?? 0,
  }
}
