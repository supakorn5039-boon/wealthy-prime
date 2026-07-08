import { useEffect, useRef, useState } from 'react'
import { parseGoogleMapsUrl } from '@/utils/parseGoogleMapsUrl'
import { GeocodeService } from '@/services/GeocodeService'
import type { GeocodeResult } from '@/types/Geocode'

export type MapUrlStatus = 'idle' | 'resolving' | 'found' | 'notfound'

interface MapUrlCoordsState {
  status: MapUrlStatus
  source: GeocodeResult['source'] | null
}

function isResolvableMapUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return (
      host === 'maps.app.goo.gl' ||
      host === 'goo.gl' ||
      host === 'g.co' ||
      host === 'google.com' ||
      host.endsWith('.google.com') ||
      /^(www\.|maps\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host)
    )
  } catch {
    return false
  }
}

export function useMapUrlCoords(
  url: string | undefined,
  apply: (lat: number, lng: number) => void,
): MapUrlCoordsState {
  const [state, setState] = useState<MapUrlCoordsState>({ status: 'idle', source: null })
  const applyRef = useRef(apply)
  applyRef.current = apply
  const lastRequested = useRef('')
  const initialUrl = useRef<string | null>(null)

  useEffect(() => {
    const value = (url ?? '').trim()
    if (initialUrl.current === null) {
      initialUrl.current = value
    }
    if (!value || value === initialUrl.current) {
      setState({ status: 'idle', source: null })
      return
    }

    const local = parseGoogleMapsUrl(value)
    if (local) {
      applyRef.current(local.lat, local.lng)
      setState({ status: 'found', source: 'url' })
      return
    }

    if (!isResolvableMapUrl(value) || lastRequested.current === value) {
      return
    }

    let cancelled = false
    setState({ status: 'resolving', source: null })
    const timer = setTimeout(async () => {
      lastRequested.current = value
      try {
        const result = await GeocodeService.resolveMapUrl(value)
        if (cancelled) return
        if (result.found && result.lat != null && result.lng != null) {
          applyRef.current(result.lat, result.lng)
          setState({ status: 'found', source: result.source })
        } else {
          setState({ status: 'notfound', source: 'none' })
        }
      } catch {
        if (!cancelled) setState({ status: 'notfound', source: 'none' })
      }
    }, 600)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [url])

  return state
}
