import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export const PROPERTY_KINDS = [
  'condo',
  'studio',
  'house',
  'semi_detached_house',
  'townhouse',
  'home_office',
  'commercial',
  'office',
  'shop',
  'warehouse',
  'land',
  'hotel',
  'apartment',
] as const
export const PROPERTY_LISTINGS = ['rent', 'sell', 'both'] as const
export const PROPERTY_PETS = ['allowed', 'not_allowed'] as const
export const PROPERTY_FURNITURE = ['full', 'partial', 'none'] as const

export function usePropertyOptions() {
  const { t, i18n } = useTranslation()
  return useMemo(
    () => ({
      kindOptions: PROPERTY_KINDS.map((v) => ({ value: v, label: t(`property.kind.${v}`) })),
      listingOptions: PROPERTY_LISTINGS.map((v) => ({ value: v, label: t(`property.listing.${v}`) })),
      petsOptions: PROPERTY_PETS.map((v) => ({ value: v, label: t(`property.pets.${v}`) })),
      furnitureOptions: PROPERTY_FURNITURE.map((v) => ({ value: v, label: t(`property.furniture.${v}`) })),
    }),
    [t, i18n.language]
  )
}
