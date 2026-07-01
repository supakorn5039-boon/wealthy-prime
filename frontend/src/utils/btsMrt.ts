import { BTS_MRT_STATION_BY_ID } from '@/constants/Locations'

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
