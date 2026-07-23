import { stationDisplayName } from '@/constants/Locations'

export function formatBtsMrt(
  value: readonly number[] | number[] | string | null | undefined,
  lang: string = 'th',
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
        return stationDisplayName(id, lang)
      }
      return token
    })
    .join(', ')
}
