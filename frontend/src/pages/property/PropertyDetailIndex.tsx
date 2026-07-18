import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Maximize2, ShoppingCart, Pencil, Copy, Bed, Bath, Building, Train, PawPrint, Sofa, FileText, MessageSquare, Star, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { defaultPinIcon } from '@/components/property/propertyMap'
import { PropertyService } from '@/services/PropertyService'
import { ReviewService } from '@/services/ReviewService'
import { PropertyGallery } from '@/components/property/PropertyGallery'
import { EditPropertyDialog } from '@/components/property/EditPropertyDialog'
import { WriteReviewDialog } from '@/components/property/WriteReviewDialog'
import { ListingOwnerPreviewDialog } from '@/components/property/ListingOwnerPreviewDialog'
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
import { formatDate } from '@/utils/date'
import { primaryPrice } from '@/utils/price'
import { PropertyPrices } from '@/components/property/PropertyPrices'
import { formatBtsMrt } from '@/utils/btsMrt'
import { canSeeOwnerInfo } from '@/utils/permissions'
import type { Review } from '@/types/Review'

const REVIEWS_ENABLED = false

export default function PropertyDetailIndex() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { addItem, openCart } = useCartStore()
  const { user } = useAuthStore()
  const [editOpen, setEditOpen] = useState(false)
  const [writeReviewOpen, setWriteReviewOpen] = useState(false)
  const [downloadingImages, setDownloadingImages] = useState(false)

  const { data: property, isLoading } = useQuery({
    queryKey: [PropertyService.QUERY_KEYS.DETAIL, id],
    queryFn: () => PropertyService.detail(id!),
    enabled: !!id,
  })

  const ownerInfoAllowed = canSeeOwnerInfo(user?.role)

  const { data: reviews = [] } = useQuery({
    queryKey: [ReviewService.QUERY_KEYS.PROPERTY_REVIEWS, id],
    queryFn: () => ReviewService.getByProperty(id!),
    enabled: !!id,
  })

  const handleAddToCart = () => {
    if (!property) return
    addItem({
      propertyId: property.id,
      propertyTitle: property.projectName,
      propertyPrice: primaryPrice(property),
      propertyType: property.type,
      appointmentDate: null,
    })
    openCart()
    toast.success(t('property.addedToCart'))
  }

  const handleDownloadImages = async () => {
    if (!property) return
    setDownloadingImages(true)
    try {
      const blob = await PropertyService.downloadImagesArchive(property.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${property.propertyCode || property.id}-images.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setDownloadingImages(false)
    }
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

  const canReply =
    !!user &&
    (user.role === 'admin' ||
      (user.role === 'agent' && property.agentId === user.id))

  const myReview = user ? reviews.find((r) => r.userId === user.id) ?? null : null

  return (
    <PageContainer size="7xl" className="space-y-6">
      <PropertyGallery images={property.imageUrls} title={property.projectName} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-foreground">{property.projectName}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <PropertyStatusBadge status={property.status} />
                  <WishlistButton propertyId={property.id} />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4 flex-shrink-0 text-primary" />
                <span>{property.location}</span>
              </div>

              <div className="flex flex-wrap gap-4">
                {property.sizeSqm && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Maximize2 className="size-4 text-primary" />
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

              {REVIEWS_ENABLED && reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(avgRating)} readonly size={16} />
                  <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({reviews.length} {t('property.reviews')})</span>
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
                  <DetailItem icon={<Building className="size-4" />} label={t('property.kindLabel')} value={t(`property.kind.${property.kind}`, { defaultValue: property.kind })} />
                )}
                {property.listing && (
                  <DetailItem icon={<FileText className="size-4" />} label={t('property.listingLabel')} value={t(`property.listing.${property.listing}`, { defaultValue: property.listing })} />
                )}
                {property.bedrooms != null && (
                  <DetailItem icon={<Bed className="size-4" />} label={t('property.bedrooms')} value={String(property.bedrooms)} />
                )}
                {property.bathrooms != null && (
                  <DetailItem icon={<Bath className="size-4" />} label={t('property.bathrooms')} value={String(property.bathrooms)} />
                )}
                {property.floor != null && (
                  <DetailItem icon={<Building className="size-4" />} label={t('property.floor')} value={String(property.floor)} />
                )}
                {property.sizeSqm != null && (
                  <DetailItem icon={<Maximize2 className="size-4" />} label={t('property.size')} value={`${property.sizeSqm} ${t('property.sqm')}`} />
                )}
                {property.minContract != null && property.minContract > 0 && (
                  <DetailItem icon={<FileText className="size-4" />} label={t('property.minContract')} value={`${property.minContract} ${t('property.months')}`} />
                )}
                {property.pets && (
                  <DetailItem icon={<PawPrint className="size-4" />} label={t('property.petsLabel')} value={t(`property.pets.${property.pets}`, { defaultValue: property.pets })} />
                )}
                {property.furniture && (
                  <DetailItem icon={<Sofa className="size-4" />} label={t('property.furnitureLabel')} value={t(`property.furniture.${property.furniture}`, { defaultValue: property.furniture })} />
                )}
                {formatBtsMrt(property.btsMrt) && (
                  <DetailItem icon={<Train className="size-4" />} label={t('property.btsMrt')} value={formatBtsMrt(property.btsMrt)} />
                )}
                {property.province && (
                  <DetailItem icon={<MapPin className="size-4" />} label={t('property.province')} value={property.province} />
                )}
                {property.district && (
                  <DetailItem icon={<MapPin className="size-4" />} label={t('property.district')} value={property.district} />
                )}
              </div>
            </CardContent>
          </Card>

          {property.adCaption && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{t('property.adCaption')}</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleCopyCaption}>
                  <Copy className="size-3.5 mr-1.5" />
                  {t('common.copy')}
                </Button>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-foreground">{property.adCaption}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('property.map')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-md overflow-hidden bg-muted">
                {property.lat != null && property.lng != null ? (
                  <MapContainer
                    center={[property.lat, property.lng]}
                    zoom={16}
                    scrollWheelZoom={false}
                    style={{ width: '100%', height: '100%' }}
                    attributionControl={false}
                  >
                    <TileLayer detectRetina url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[property.lat, property.lng]} icon={defaultPinIcon} />
                  </MapContainer>
                ) : (
                  <div className="size-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                    <MapPin className="size-6" />
                    <span>{t('property.noCoordsAvailable')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {REVIEWS_ENABLED && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{t('property.reviewsTitle')}</CardTitle>
                {user && (
                  <Button size="sm" onClick={() => setWriteReviewOpen(true)}>
                    <Star className="size-3.5 mr-1.5" />
                    {myReview ? t('review.editYourReview') : t('review.writeReview')}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <EmptyState title={t('property.noReviews')} description={t('property.beFirstReview')} />
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewItem
                        key={review.id}
                        review={review}
                        propertyId={property.id}
                        canReply={canReply}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="sticky top-24">
            <CardContent className="pt-6 space-y-4">
              <PropertyPrices property={property} size="lg" className="space-y-1" />

              {property.agentName && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">{t('property.responsibleAgent')}</p>
                  <p>{property.agentName}</p>
                </div>
              )}

              <div className="space-y-2">
                {property.status === 'available' && (
                  <Button className="w-full" onClick={handleAddToCart}>
                    <ShoppingCart className="size-4 mr-2" />
                    {t('property.addToCart')}
                  </Button>
                )}
                {ownerInfoAllowed && id && (
                  <ListingOwnerPreviewDialog propertyId={id} fullWidth />
                )}
                {ownerInfoAllowed && (property.imageUrls?.length ?? 0) > 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDownloadImages}
                    disabled={downloadingImages}
                  >
                    <Download className="size-4 mr-2" />
                    {downloadingImages
                      ? t('property.downloadingImages')
                      : t('property.downloadAllImages')}
                  </Button>
                )}
                {canEdit && (
                  <Button variant="outline" className="w-full" onClick={() => setEditOpen(true)}>
                    <Pencil className="size-4 mr-2" />
                    {t('common.edit')}
                  </Button>
                )}
              </div>

              <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                <p>{t('property.listedAt')} {formatDate(property.createdAt)}</p>
                {property.propertyCode && (
                  <p>{t('property.propertyCode')} {property.propertyCode}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {canEdit && editOpen && (
        <EditPropertyDialog
          property={property}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}

      {user && (
        <WriteReviewDialog
          propertyId={property.id}
          propertyTitle={property.projectName}
          existing={myReview}
          open={writeReviewOpen}
          onClose={() => setWriteReviewOpen(false)}
        />
      )}
    </PageContainer>
  )
}

function ReviewItem({
  review,
  propertyId,
  canReply,
}: {
  review: Review
  propertyId: number
  canReply: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(review.reply ?? '')

  const mutation = useMutation({
    mutationFn: () => ReviewService.reply({ reviewId: review.id, reply: draft.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ReviewService.QUERY_KEYS.PROPERTY_REVIEWS, String(propertyId)],
      })
      setEditing(false)
    },
    onError: () => toast.error(t('review.replyFailed')),
  })

  const replyRoleLabel =
    review.repliedByRole === 'admin' ? t('review.adminReply') : t('review.agentReply')

  return (
    <div className="border-b pb-4 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
            {review.userName?.[0] ?? 'U'}
          </div>
          <span className="font-medium text-sm">{review.userName ?? t('role.user')}</span>
        </div>
        <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
      </div>
      <StarRating value={review.rating} readonly size={14} />
      {review.comment && <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>}

      {review.reply && !editing && (
        <div className="mt-3 ml-4 pl-4 border-l-2 border-primary/30 bg-muted/40 rounded-r p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 text-xs">
              <MessageSquare className="size-3.5 text-primary" />
              <span className="font-medium">{review.repliedByName ?? replyRoleLabel}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {replyRoleLabel}
              </Badge>
            </div>
            {review.repliedAt && (
              <span className="text-xs text-muted-foreground">{formatDate(review.repliedAt)}</span>
            )}
          </div>
          <p className="text-sm text-foreground whitespace-pre-line">{review.reply}</p>
        </div>
      )}

      {canReply && (
        <div className="mt-3">
          {!editing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(review.reply ?? '')
                setEditing(true)
              }}
            >
              <MessageSquare className="size-3.5 mr-1.5" />
              {review.reply ? t('review.editReply') : t('review.reply')}
            </Button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t('review.replyPlaceholder')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!draft.trim() || mutation.isPending}
                  onClick={() => mutation.mutate()}
                >
                  {mutation.isPending ? t('common.saving') : t('review.submitReply')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="text-primary mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}
