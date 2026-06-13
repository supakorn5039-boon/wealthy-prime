import { BTS_MRT_STATION_BY_ID } from '@/constants/Locations'

// formatBtsMrt resolves station IDs to human-readable names. Accepts either
// a number[] (current wire shape) or a CSV string (legacy rows + the
// react-hook-form chip field which stores selection as a CSV of IDs).
export function formatBtsMrt(
  value: readonly number[] | number[] | string | null | undefined,
): string {
  if (value == null || value === '') return ''
  const tokens = Array.isArray(value)
    ? value.map(String)
    : String(value)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
  return tokens
    .map((token) => {
      const id = Number(token)
      if (Number.isFinite(id)) {
        return BTS_MRT_STATION_BY_ID.get(id)?.name ?? token
      }
      return token
    })
    .join(', ')
}
