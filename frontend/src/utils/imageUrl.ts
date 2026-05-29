const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

const FILE_ORIGIN = (() => {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    return new URL(API_BASE, origin).origin
  } catch {
    return typeof window !== 'undefined' ? window.location.origin : ''
  }
})()

export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }
  return path.startsWith('/') ? `${FILE_ORIGIN}${path}` : `${FILE_ORIGIN}/${path}`
}
