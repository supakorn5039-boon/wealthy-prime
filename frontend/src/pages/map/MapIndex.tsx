import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Star, Maximize2, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PropertyService } from '@/services/PropertyService'
import { PropertyStatusBadge } from '@/components/shared/StatusBadge'
import { PageTitle } from '@/components/shared/PageTitle'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/utils/date'
import type { Property } from '@/types/Property'

// Fix leaflet default marker icon broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      width:32px;height:32px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  })
}

const STATUS_COLOR: Record<string, string> = {
  available: '#22c55e',
  reserved: '#f59e0b',
  pending_approve: '#6366f1',
  sold: '#ef4444',
  rented: '#64748b',
}

function FlyTo({ position }: { position: [number, number] }) {
  const map = useMap()
  map.flyTo(position, 15, { duration: 1 })
  return null
}

export default function MapIndex() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<Property | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: [PropertyService.QUERY_KEYS.LIST, {}],
    queryFn: () => PropertyService.list({}),
  })

  const properties = (data?.data ?? []).filter(p => p.lat && p.lng)

  function handleMarkerClick(p: Property) {
    setSelected(p)
    setModalOpen(true)
    if (p.lat && p.lng) setFlyTarget([p.lat, p.lng])
  }

  function handleListClick(p: Property) {
    setSelected(p)
    if (p.lat && p.lng) setFlyTarget([p.lat, p.lng])
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageTitle title={t('nav.map')} subtitle={t('map.subtitle')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden border shadow-sm" style={{ height: 540 }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <LoadingSpinner text={t('common.loading')} />
              </div>
            ) : (
              <MapContainer
                center={[13.7563, 100.5018]}
                zoom={12}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {flyTarget && <FlyTo position={flyTarget} key={flyTarget.join(',')} />}

                {properties.map((p) => (
                  <Marker
                    key={p.id}
                    position={[p.lat!, p.lng!]}
                    icon={makeIcon(STATUS_COLOR[p.status] ?? '#6366f1')}
                    eventHandlers={{ click: () => handleMarkerClick(p) }}
                  >
                    <Popup>
                      <div className="text-sm font-medium">{p.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatPrice(p.price)}
                        {p.type === 'rent' && <span className="ml-1">/ {t('property.perMonth')}</span>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2 px-1">
            {Object.entries(STATUS_COLOR).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
                {t(`property.status.${status}`)}
              </div>
            ))}
          </div>
        </div>

        {/* Property list */}
        <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 540 }}>
          {isLoading ? (
            <LoadingSpinner text={t('common.loading')} />
          ) : properties.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t('home.noResults')}</p>
          ) : (
            properties.map((p) => (
              <div
                key={p.id}
                onClick={() => handleListClick(p)}
                className={`cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md hover:border-primary/50 ${
                  selected?.id === p.id ? 'ring-2 ring-primary border-primary' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{p.title}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1">{p.location}</span>
                    </div>
                    <p className="text-primary font-semibold text-sm mt-1">
                      {formatPrice(p.price)}
                      {p.type === 'rent' && <span className="ml-1 text-xs font-normal text-gray-500">/ {t('property.perMonth')}</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <PropertyStatusBadge status={p.status} />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkerClick(p) }}
                      className="text-xs text-primary hover:underline flex items-center gap-0.5"
                    >
                      <Maximize2 className="h-3 w-3" />
                      {t('map.view')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Property detail modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base leading-snug pr-6">{selected.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 mt-1">
                {/* Status + type */}
                <div className="flex items-center gap-2">
                  <PropertyStatusBadge status={selected.status} />
                  <Badge variant="outline" className="text-xs capitalize">
                    {t(`property.${selected.type}`)}
                  </Badge>
                </div>

                {/* Price */}
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(selected.price)}
                  {selected.type === 'rent' && (
                    <span className="text-sm font-normal text-gray-500 ml-1">/{t('property.perMonth')}</span>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="line-clamp-1">{selected.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Home className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span>{selected.projectName}</span>
                  </div>
                  {selected.sizeSqm && (
                    <div className="text-gray-600">
                      {selected.sizeSqm} {t('property.sqm')}
                    </div>
                  )}
                  {selected.rentalPeriodMonths && (
                    <div className="text-gray-600">
                      {selected.rentalPeriodMonths} {t('property.months')}
                    </div>
                  )}
                </div>

                {/* Rating */}
                {selected.rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{selected.rating.toFixed(1)}</span>
                    <span className="text-gray-400">({selected.reviewCount} {t('property.reviews')})</span>
                  </div>
                )}

                {/* Agent */}
                {selected.agentName && (
                  <p className="text-xs text-gray-500">
                    {t('property.responsibleAgent')}: <span className="font-medium text-gray-700">{selected.agentName}</span>
                  </p>
                )}

                <Link to={`/property/${selected.id}`} onClick={() => setModalOpen(false)}>
                  <Button className="w-full mt-1">
                    {t('map.view')} →
                  </Button>
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
