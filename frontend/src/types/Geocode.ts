export interface GeocodeResult {
  found: boolean
  lat?: number
  lng?: number
  resolvedUrl?: string
  source: 'url' | 'geocode' | 'none'
}
