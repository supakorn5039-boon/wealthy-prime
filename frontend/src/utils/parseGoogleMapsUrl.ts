// Extracts (lat, lng) from a Google Maps URL.
// Tries the place pin first (!3d / !4d), then the map center (@lat,lng),
// then the legacy ?q= / ?ll= query forms.
export function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null

  // Google Maps URLs can contain multiple !3d!4d blocks (parent place → child place).
  // The deepest/most specific place is the LAST occurrence, so grab the final match.
  const placePins = Array.from(url.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g))
  const lastPin = placePins[placePins.length - 1]
  if (lastPin) return coords(lastPin[1], lastPin[2])

  const atCenter = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
  if (atCenter) return coords(atCenter[1], atCenter[2])

  const query = url.match(/[?&](?:q|ll|destination)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
  if (query) return coords(query[1], query[2])

  return null
}

function coords(latStr: string, lngStr: string): { lat: number; lng: number } | null {
  const lat = Number(latStr)
  const lng = Number(lngStr)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}
