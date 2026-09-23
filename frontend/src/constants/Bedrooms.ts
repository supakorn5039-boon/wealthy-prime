export const STUDIO_BEDROOM = 'studio'

const BEDROOM_COUNTS = Array.from({ length: 11 }, (_, i) => i)

export const BEDROOM_ORDER: string[] = [
  '0',
  STUDIO_BEDROOM,
  ...BEDROOM_COUNTS.slice(1).map(String),
]

export type BedroomChoice = string

export function customBedroomValue(query: string): string | null {
  const raw = query.trim()
  if (!raw) return null
  if (!/^\d+$/.test(raw)) return null
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n < 0 || n > 999) return null
  return String(n)
}

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
