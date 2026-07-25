import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Map as MaplibreMap, ExpressionSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@maplibre/maplibre-gl-leaflet'
import { useTranslation } from 'react-i18next'

const OSM_FALLBACK_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const STYLE_URL = import.meta.env.VITE_MAP_STYLE_URL ?? DEFAULT_STYLE_URL
const MAP_ATTRIBUTION = '&copy; OpenStreetMap contributors'

const NAME_FIELD_BY_LOCALE: Record<string, string> = {
  th: 'name:th',
  en: 'name:en',
  zh: 'name:zh',
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function nameExpression(locale: string): ExpressionSpecification {
  const base = locale.split('-')[0]
  const field = NAME_FIELD_BY_LOCALE[base] ?? 'name:en'
  return ['coalesce', ['get', field], ['get', 'name:latin'], ['get', 'name']]
}

function applyLabelLanguage(glMap: MaplibreMap, locale: string): void {
  const expr = nameExpression(locale)
  for (const layer of glMap.getStyle().layers ?? []) {
    if (layer.type === 'symbol' && layer.layout?.['text-field'] !== undefined) {
      glMap.setLayoutProperty(layer.id, 'text-field', expr)
    }
  }
}

export function LocalizedTileLayer() {
  const map = useMap()
  const { i18n } = useTranslation()
  const glMapRef = useRef<MaplibreMap | null>(null)
  const localeRef = useRef(i18n.language)
  localeRef.current = i18n.language

  useEffect(() => {
    if (!supportsWebGL()) {
      const raster = L.tileLayer(OSM_FALLBACK_URL, { detectRetina: true, attribution: MAP_ATTRIBUTION })
      raster.addTo(map)
      return () => {
        raster.remove()
      }
    }

    const glLayer = L.maplibreGL({ style: STYLE_URL })
    glLayer.addTo(map)
    const glMap = glLayer.getMaplibreMap()
    glMapRef.current = glMap

    const applyCurrent = () => applyLabelLanguage(glMap, localeRef.current)
    glMap.on('load', applyCurrent)

    return () => {
      glMap.off('load', applyCurrent)
      glMapRef.current = null
      glLayer.remove()
    }
  }, [map])

  useEffect(() => {
    const glMap = glMapRef.current
    if (glMap && glMap.isStyleLoaded()) applyLabelLanguage(glMap, i18n.language)
  }, [i18n.language])

  return null
}
