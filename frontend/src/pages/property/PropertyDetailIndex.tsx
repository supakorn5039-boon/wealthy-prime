import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Maximize2, ShoppingCart, Phone, MessageCircle, Pencil, Copy, Bed, Bath, Building, Train, PawPrint, Sofa, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { PropertyService } from '@/services/PropertyService'
import { ReviewService } from '@/services/ReviewService'
import { PropertyGallery } from '@/components/property/PropertyGallery'
import { ContactAgentDialog } from '@/components/property/ContactAgentDialog'
import { EditPropertyDialog } from '@/components/property/EditPropertyDialog'
import { PropertyStatusBadge } from '@/components/shared/StatusBadge'
import { WishlistButton } from '@/components/WishlistButton'
import { StarRating } from '@/components/StarRating'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageContainer } from '@/components/shared/PageContainer'
import { copyToClipboard } from '@/utils/copyToClipboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/hooks/useCartStore'
import { useAuthStore } from '@/store/authStore'
import { formatPrice, formatDate } from '@/utils/date'
import { ROUTES } from '@/constants/Routes'

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="
    background:#6366f1;
    width:28px;height:28px;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

export default function PropertyDetailIndex() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { addItem, openCart } = useCartStore()
  const { user } = useAuthStore()
  const [contactOpen, setContactOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const { data: property, isLoading } = useQuery({
    queryKey: [PropertyService.QUERY_KEYS.DETAIL, id],
    queryFn: () => PropertyService.detail(id!),
    enabled: !!id,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: [ReviewService.QUERY_KEYS.PROPERTY_REVIEWS, id],
    queryFn: () => ReviewService.getByProperty(id!),
    enabled: !!id,
  })

  const handleAddToCart = () => {
    if (!property) return
    addItem({
      propertyId: property.id,
      propertyTitle: property.title,
      propertyPrice: property.price,
      propertyType: property.type,
      appointmentDate: null,
    })
    openCart()
    toast.success(t('property.addedToCart'))
  }

  const handleCopyCaption = async () => {
    if (!property?.adCaption) return
    try {
      await copyToClipboard(property.adCaption)
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleContact = () => {
    if (!user) {
      toast.error(t('cart.loginRequired'))
      navigate(ROUTES.LOGIN, { state: { from: location } })
      return
    }
    setContactOpen(true)
  }

  if (isLoading) return <LoadingSpinner text={t('common.loading')} />
  if (!property) return <EmptyState title={t('property.notFound')} />

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  const canEdit =
    !!user &&
    (user.role === 'admin' ||
      (user.role === 'agent' && property.agentId === user.id))

  return (
    <PageContainer size="7xl" className="space-y-6">
      <PropertyGallery images={property.imageUrls} title={property.title} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
                  <p className="text-muted-foreground mt-1">{property.projectName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PropertyStatusBadge status={property.status} />
                  <WishlistButton propertyId={property.id} />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-gray-600">
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>{property.location}</span>
              </div>

              <div className="flex flex-wrap gap-4">
                {property.sizeSqm && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Maximize2 className="h-4 w-4 text-primary" />
                    <span>{property.sizeSqm} {t('property.sqm')}</span>
                  </div>
                )}
                <Badge variant="outline">
                  {t(`property.${property.type}`)}
                </Badge>
                {property.type === 'rent' && property.rentalPeriodMonths && (
                  <Badge variant="outline">{property.rentalPeriodMonths} {t('property.months')}</Badge>
                )}
              </div>

              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(avgRating)} readonly size={16} />
                  <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({reviews.length} {t('property.reviews')})</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('property.specsSection')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                {property.kind && (
                  <DetailItem icon={<Building className="h-4 w-4" />} label={t('property.kindLabel')} value={t(`property.kind.${property.kind}`, { defaultValue: property.kind })} />
                )}
                {property.listing && (
                  <DetailItem icon={<FileText className="h-4 w-4" />} label={t('property.listingLabel')} value={t(`property.listing.${property.listing}`, { defaultValue: property.listing })} />
                )}
                {property.bedrooms != null && (
                  <DetailItem icon={<Bed className="h-4 w-4" />} label={t('property.bedrooms')} value={String(property.bedrooms)} />
                )}
                {property.bathrooms != null && (
                  <DetailItem icon={<Bath className="h-4 w-4" />} label={t('property.bathrooms')} value={String(property.bathrooms)} />
                )}
                {property.floor != null && (
                  <DetailItem icon={<Building className="h-4 w-4" />} label={t('property.floor')} value={String(property.floor)} />
                )}
                {property.sizeSqm != null && (
                  <DetailItem icon={<Maximize2 className="h-4 w-4" />} label={t('property.size')} value={`${property.sizeSqm} ${t('property.sqm')}`} />
                )}
                {property.minContract != null && property.minContract > 0 && (
                  <DetailItem icon={<FileText className="h-4 w-4" />} label={t('property.minContract')} value={`${property.minContract} ${t('property.months')}`} />
                )}
                {property.pets && (
                  <DetailItem icon={<PawPrint className="h-4 w-4" />} label={t('property.petsLabel')} value={t(`property.pets.${property.pets}`, { defaultValue: property.pets })} />
                )}
                {property.furniture && (
                  <DetailItem icon={<Sofa className="h-4 w-4" />} label={t('property.furnitureLabel')} value={t(`property.furniture.${property.furniture}`, { defaultValue: property.furniture })} />
                )}
                {property.btsMrt && (
                  <DetailItem icon={<Train className="h-4 w-4" />} label={t('property.btsMrt')} value={property.btsMrt} />
                )}
                {property.province && (
                  <DetailItem icon={<MapPin className="h-4 w-4" />} label={t('property.province')} value={property.province} />
                )}
                {property.district && (
                  <DetailItem icon={<MapPin className="h-4 w-4" />} label={t('property.district')} value={property.district} />
                )}
              </div>
            </CardContent>
          </Card>

          {property.adCaption && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{t('property.adCaption')}</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleCopyCaption}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  {t('common.copy')}
                </Button>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-gray-700">{property.adCaption}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('property.map')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-md overflow-hidden bg-gray-100">
                {property.lat != null && property.lng != null ? (
                  <MapContainer
                    center={[property.lat, property.lng]}
                    zoom={16}
                    scrollWheelZoom={false}
                    style={{ width: '100%', height: '100%' }}
                    attributionControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[property.lat, property.lng]} icon={pinIcon} />
                  </MapContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                    <MapPin className="h-6 w-6" />
                    <span>{t('property.noCoordsAvailable')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('property.reviewsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <EmptyState title={t('property.noReviews')} description={t('property.beFirstReview')} />
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {review.userName?.[0] ?? 'U'}
                          </div>
                          <span className="font-medium text-sm">{review.userName ?? t('role.user')}</span>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                      </div>
                      <StarRating value={review.rating} readonly size={14} />
                      {review.comment && <p className="text-sm text-gray-600 mt-2">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-24">
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-3xl font-bold text-primary">{formatPrice(property.price)}</p>
                {property.type === 'rent' && <p className="text-sm text-gray-400 mt-0.5">{t('property.perMonth')}</p>}
              </div>

              {property.agentName && (
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{t('property.responsibleAgent')}</p>
                  <p>{property.agentName}</p>
                </div>
              )}

              <div className="space-y-2">
                {property.status === 'available' && (
                  <Button className="w-full" onClick={handleAddToCart}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {t('property.addToCart')}
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={handleContact}>
                  <Phone className="h-4 w-4 mr-2" />
                  {t('property.contactAgent')}
                </Button>
                {property.agentName && (
                  <Button className="w-full bg-[#06C755] hover:bg-[#05a847] text-white">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t('property.lineContact')}
                  </Button>
                )}
                {canEdit && (
                  <Button variant="outline" className="w-full" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    {t('common.edit')}
                  </Button>
                )}
              </div>

              <div className="pt-2 border-t text-xs text-gray-400 space-y-1">
                <p>{t('property.listedAt')} {formatDate(property.createdAt)}</p>
                <p>{t('property.propertyCode')} #{property.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ContactAgentDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        propertyId={property.id}
        propertyTitle={property.title}
      />

      {canEdit && editOpen && (
        <EditPropertyDialog
          property={property}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </PageContainer>
  )
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="text-primary mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  )
}
