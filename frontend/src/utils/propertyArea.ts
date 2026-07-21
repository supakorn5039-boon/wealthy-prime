import type { Property } from '@/types/Property'

export function formatPropertyArea(
  property: Pick<Property, 'district' | 'province' | 'location'>
): string {
  const parts = [property.district, property.province].filter((p): p is string => !!p)
  if (parts.length > 0) return parts.join(', ')
  return property.location ?? ''
}
