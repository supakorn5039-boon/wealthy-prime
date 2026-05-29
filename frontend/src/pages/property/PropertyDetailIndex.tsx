import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Maximize2, ShoppingCart, Phone, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { PropertyService } from '@/services/PropertyService'
import { ReviewService } from '@/services/ReviewService'
import { PropertyGallery } from '@/components/property/PropertyGallery'
import { PropertyStatusBadge } from '@/components/shared/StatusBadge'
import { WishlistButton } from '@/components/WishlistButton'
import { StarRating } from '@/components/StarRating'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/hooks/useCartStore'
import { useAuthStore } from '@/store/authStore'
import { formatPrice, formatDate } from '@/utils/date'
import { ROUTES } from '@/constants/Routes'

export default function PropertyDetailIndex() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem, openCart } = useCartStore()
  const { user } = useAuthStore()

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

  const handleContact = () => {
    if (!user) {
      toast.error(t('cart.loginRequired'))
      navigate(ROUTES.LOGIN)
      return
    }
    toast.info(t('property.contactSent'))
  }

  if (isLoading) return <LoadingSpinner text={t('common.loading')} />
  if (!property) return <EmptyState title={t('property.notFound')} />

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
              <CardTitle className="text-base">{t('property.map')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <iframe
                  title="map"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(property.location)}&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
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
                  <Button variant="ghost" className="w-full text-green-600 hover:text-green-700 hover:bg-green-50">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t('property.lineContact')}
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
    </div>
  )
}
