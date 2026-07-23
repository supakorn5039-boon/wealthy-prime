import type { Property } from '@/types/Property'
import { localizedDistrict, localizedProvince } from '@/constants/Locations'

export function formatPropertyArea(
  property: Pick<Property, 'district' | 'province' | 'location'>,
  lang: string,
): string {
  const parts = [
    property.district ? localizedDistrict(property.district, lang) : undefined,
    property.province ? localizedProvince(property.province, lang) : undefined,
  ].filter((p): p is string => !!p)
  if (parts.length > 0) return parts.join(', ')
  return property.location ?? ''
}
