import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { MapPin, Star, Maximize2, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PropertyService } from '@/services/PropertyService'
import { PropertyStatusBadge } from '@/components/shared/StatusBadge'
import { PageTitle } from '@/components/shared/PageTitle'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { PageContainer } from '@/components/shared/PageContainer'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/utils/date'
import { FlyTo, MapStatusLegend, buildStatusIconResolver } from '@/components/property/propertyMap'
import type { Property } from '@/types/Property'

const iconFor = buildStatusIconResolver(32)

export default function MapIndex() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<Property | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: [PropertyService.QUERY_KEYS.LIST, {}],
    queryFn: () => PropertyService.list({}),
  })

  const properties = useMemo(
    () => (data?.data ?? []).filter((p) => p.lat != null && p.lng != null),
    [data],
  )

  function handleMarkerClick(p: Property) {
    setSelected(p)
    setModalOpen(true)
    if (p.lat != null && p.lng != null) setFlyTarget([p.lat, p.lng])
  }

  function handleListClick(p: Property) {
    setSelected(p)
    if (p.lat != null && p.lng != null) setFlyTarget([p.lat, p.lng])
  }

  return (
    <PageContainer size="7xl" className="space-y-4">
      <PageTitle title={t('nav.map')} subtitle={t('map.subtitle')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden border shadow-sm" style={{ height: 540 }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full bg-muted/40">
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
                    icon={iconFor(p.status)}
                    eventHandlers={{ click: () => handleMarkerClick(p) }}
                  >
                    <Popup>
                      <div className="text-sm font-medium">{p.projectName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatPrice(p.price)}
                        {p.type === 'rent' && <span className="ml-1">/ {t('property.perMonth')}</span>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          <MapStatusLegend className="flex" />
        </div>

        <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 540 }}>
          {isLoading ? (
            <LoadingSpinner text={t('common.loading')} />
          ) : properties.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('home.noResults')}</p>
          ) : (
            properties.map((p) => (
              <div
                key={p.id}
                onClick={() => handleListClick(p)}
                className={`cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md hover:border-primary/50 ${
                  selected?.id === p.id ? 'ring-2 ring-primary border-primary' : 'bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{p.projectName}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="size-3 flex-shrink-0" />
                      <span className="line-clamp-1">{p.location}</span>
                    </div>
                    <p className="text-primary font-semibold text-sm mt-1">
                      {formatPrice(p.price)}
                      {p.type === 'rent' && <span className="ml-1 text-xs font-normal text-muted-foreground">/ {t('property.perMonth')}</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <PropertyStatusBadge status={p.status} />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkerClick(p) }}
                      className="text-xs text-primary hover:underline flex items-center gap-0.5"
                    >
                      <Maximize2 className="size-3" />
                      {t('map.view')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base leading-snug pr-6">{selected.projectName}</DialogTitle>
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
                    <span className="text-sm font-normal text-muted-foreground ml-1">/{t('property.perMonth')}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="line-clamp-1">{selected.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Home className="size-3.5 shrink-0 text-muted-foreground" />
                    <span>{selected.projectName}</span>
                  </div>
                  {selected.sizeSqm && (
                    <div className="text-muted-foreground">
                      {selected.sizeSqm} {t('property.sqm')}
                    </div>
                  )}
                  {selected.rentalPeriodMonths && (
                    <div className="text-muted-foreground">
                      {selected.rentalPeriodMonths} {t('property.months')}
                    </div>
                  )}
                </div>

                {selected.rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{selected.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({selected.reviewCount} {t('property.reviews')})</span>
                  </div>
                )}

                {selected.agentName && (
                  <p className="text-xs text-muted-foreground">
                    {t('property.responsibleAgent')}: <span className="font-medium text-foreground">{selected.agentName}</span>
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
    </PageContainer>
  )
}
