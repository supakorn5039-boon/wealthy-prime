export const STUDIO_BEDROOM = 'studio'

export const BEDROOM_COUNTS = Array.from({ length: 11 }, (_, i) => i)

export type BedroomChoice = string

export function bedroomChoiceOf(bedrooms?: number | null, isStudio?: boolean): BedroomChoice {
  if (isStudio) return STUDIO_BEDROOM
  if (bedrooms == null) return ''
  return String(bedrooms)
}

export function bedroomPayload(choice?: BedroomChoice): { bedrooms?: number; isStudio: boolean } {
  if (choice === STUDIO_BEDROOM) return { bedrooms: 0, isStudio: true }
  if (!choice) return { bedrooms: undefined, isStudio: false }
  return { bedrooms: Number(choice), isStudio: false }
}

export function formatBedrooms(
  bedrooms: number | null | undefined,
  isStudio: boolean | undefined,
  studioLabel: string,
): string | null {
  if (isStudio) return studioLabel
  if (bedrooms == null) return null
  return String(bedrooms)
}
