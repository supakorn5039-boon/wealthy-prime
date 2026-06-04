import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Star, Home as HomeIcon } from 'lucide-react'
import { PropertyService } from '@/services/PropertyService'
import { PropertyCard } from '@/components/property/PropertyCard'
import { PropertyStatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Hero } from '@/pages/home/components/Hero'
import { PageContainer } from '@/components/shared/PageContainer'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/utils/date'
import type { Property, PropertyListParams, PropertyKind, PropertyType } from '@/types/Property'

type ChipKind = PropertyKind | 'premium'

// Leaflet default markers break under bundlers; point them at the CDN copies.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS_COLOR: Record<string, string> = {
  available: '#22c55e',
  reserved: '#f59e0b',
  pending_approve: '#6366f1',
  sold: '#ef4444',
  rented: '#64748b',
}

function makeIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      width:28px;height:28px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}

function FlyTo({ position }: { position: [number, number] }) {
  const map = useMap()
  map.flyTo(position, 15, { duration: 1 })
  return null
}

export default function HomeIndex() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<PropertyListParams>({})
  const [activeKind, setActiveKind] = useState<ChipKind | ''>('')
  const [selected, setSelected] = useState<Property | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: [PropertyService.QUERY_KEYS.LIST, filters],
    queryFn: () => PropertyService.list(filters),
  })

  const handleSearchChange = (search: string) =>
    setFilters((prev) => ({ ...prev, search: search || undefined }))
  const handleSearchSubmit = () => {}
  const handleChipClick = (kind: ChipKind) =>
    setActiveKind((prev) => (prev === kind ? '' : kind))
  const handleTypeClick = (type: PropertyType | '') =>
    setFilters((prev) => ({ ...prev, type: type === '' ? undefined : type }))

  const properties = data?.data ?? []
  const filteredProperties = useMemo(() => {
    if (!activeKind) return properties
    if (activeKind === 'premium') return [...properties].sort((a, b) => b.price - a.price)
    return properties.filter((p) => p.kind === activeKind)
  }, [properties, activeKind])

  const mappable = filteredProperties.filter((p) => p.lat != null && p.lng != null)

  const hasActiveFilters = !!filters.search || !!activeKind || !!filters.type
  const headingKey = hasActiveFilters ? 'home.searchResultsTitle' : 'home.featuredTitle'

  function handleMarkerClick(p: Property) {
    setSelected(p)
    setModalOpen(true)
    if (p.lat != null && p.lng != null) setFlyTarget([p.lat, p.lng])
  }

  return (
    <div>
      <Hero
        search={filters.search ?? ''}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        activeKind={activeKind}
        onChipClick={handleChipClick}
        activeType={filters.type ?? ''}
        onTypeClick={handleTypeClick}
      />

      <PageContainer size="7xl" className="space-y-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t(headingKey)}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {t('home.foundCount', { count: filteredProperties.length })}
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner text={t('common.loading')} />
        ) : filteredProperties.length === 0 ? (
          <EmptyState title={t('home.noResults')} description={t('home.tryAdjust')} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* List: 3/5 on lg+, full width below */}
            <div className="lg:col-span-3 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredProperties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>

            {/* Map: 2/5 on lg+, sticky to viewport. On mobile shows above the list. */}
            <div className="lg:col-span-2 order-first lg:order-last">
              <div className="lg:sticky lg:top-4">
                <div className="rounded-xl overflow-hidden border shadow-sm h-[320px] lg:h-[calc(100vh-6rem)]">
                  <MapContainer
                    center={[13.7563, 100.5018]}
                    zoom={12}
                    style={{ width: '100%', height: '100%' }}
                    scrollWheelZoom
                    attributionControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {flyTarget && <FlyTo position={flyTarget} key={flyTarget.join(',')} />}
                    {mappable.map((p) => (
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
                </div>
                <div className="hidden lg:flex flex-wrap gap-3 mt-2 px-1">
                  {Object.entries(STATUS_COLOR).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
                      {t(`property.status.${status}`)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContainer>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base leading-snug pr-6">{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-1">
                <div className="flex items-center gap-2">
                  <PropertyStatusBadge status={selected.status} />
                  <Badge variant="outline" className="text-xs capitalize">
                    {t(`property.${selected.type}`)}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(selected.price)}
                  {selected.type === 'rent' && (
                    <span className="text-sm font-normal text-gray-500 ml-1">/{t('property.perMonth')}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="line-clamp-1">{selected.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <HomeIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span>{selected.projectName}</span>
                  </div>
                </div>
                {selected.rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{selected.rating.toFixed(1)}</span>
                    <span className="text-gray-400">({selected.reviewCount} {t('property.reviews')})</span>
                  </div>
                )}
                <Link to={`/property/${selected.id}`} onClick={() => setModalOpen(false)}>
                  <Button className="w-full mt-1">{t('map.view')} →</Button>
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
