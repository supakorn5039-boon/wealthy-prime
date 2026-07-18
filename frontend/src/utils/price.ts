import type { Property } from '@/types/Property'

export function primaryPrice(
  property: Pick<Property, 'listing' | 'rentPrice' | 'salePrice'>
): number | null {
  if (property.listing === 'rent') return property.rentPrice ?? null
  if (property.listing === 'sell') return property.salePrice ?? null
  return property.rentPrice ?? property.salePrice ?? null
}
