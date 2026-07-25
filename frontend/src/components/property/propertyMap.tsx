import { useEffect, useRef } from 'react'
import { useMap, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Language, MapStyle, maptilerLayer } from '@maptiler/leaflet-maptilersdk'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS_COLOR: Record<string, string> = {
  available: '#22c55e',
  reserved: '#f59e0b',
  sold: '#ef4444',
  rented: '#64748b',
}

const DEFAULT_PIN_COLOR = '#6366f1'

function makeMarkerIcon(color: string, size = 28) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      width:${size}px;height:${size}px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -(size + 2)],
  })
}

export function buildStatusIconResolver(size = 28) {
  const icons: Record<string, L.DivIcon> = Object.fromEntries(
    Object.entries(STATUS_COLOR).map(([status, color]) => [status, makeMarkerIcon(color, size)]),
  )
  const fallback = makeMarkerIcon(DEFAULT_PIN_COLOR, size)
  return (status: string) => icons[status] ?? fallback
}

export const defaultPinIcon = makeMarkerIcon(DEFAULT_PIN_COLOR)

export function FlyTo({ position }: { position: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(position, 15, { duration: 1 })
  }, [map, position])
  return null
}

export function MapStatusLegend({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex-wrap gap-3 mt-2 px-1', className)}>
      {Object.entries(STATUS_COLOR).map(([status, color]) => (
        <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block size-3 rounded-full" style={{ background: color }} />
          {t(`property.status.${status}`)}
        </div>
      ))}
    </div>
  )
}

const MAPTILER_LANG_MAP: Record<string, unknown> = {
  th: Language.THAI,
  en: Language.ENGLISH,
  zh: Language.CHINESE,
  ja: Language.JAPANESE,
  de: Language.GERMAN,
  fr: Language.FRENCH,
  es: Language.SPANISH,
  ru: Language.RUSSIAN,
  ko: Language.KOREAN,
}

export function I18nTileLayer({ apiKey }: { apiKey?: string }) {
  const map = useMap()
  const { i18n } = useTranslation()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null)
  const key = apiKey || (import.meta.env.VITE_MAPTILER_API_KEY as string | undefined)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const targetLang = (MAPTILER_LANG_MAP[i18n.language] || i18n.language || Language.ENGLISH) as any

  useEffect(() => {
    if (!key || !map) return

    try {
      if (!map.attributionControl) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(map as any).attributionControl = L.control.attribution({ prefix: false })
      }

      const layer = maptilerLayer({
        apiKey: key,
        style: MapStyle.STREETS,
        language: targetLang,
      })
      layer.addTo(map)
      layerRef.current = layer

      return () => {
        if (layerRef.current) {
          try {
            map.removeLayer(layerRef.current)
          } catch {
            // ignore
          }
          layerRef.current = null
        }
      }
    } catch (e) {
      console.error('Failed to initialize MaptilerLayer:', e)
    }
  }, [map, key])

  useEffect(() => {
    if (layerRef.current && targetLang) {
      try {
        layerRef.current.setLanguage(targetLang)
      } catch (e) {
        console.error('Failed to set Maptiler language:', e)
      }
    }
  }, [targetLang])

  if (!key) {
    return (
      <TileLayer
        key="osm-fallback"
        detectRetina
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
      />
    )
  }

  return null
}



