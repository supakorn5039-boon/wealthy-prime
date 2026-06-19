import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { User, Phone, MessageCircle, Calendar, MapPin, Search, UserCog } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdminService } from '@/services/AdminService'
import { BookingStatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDateTime } from '@/utils/date'
import type { AppointmentWorkStatus } from '@/types/Booking'

const WORK_STATUS_KEY: Record<Exclude<AppointmentWorkStatus, ''>, string> = {
  contacted: 'workStatus.contacted',
  visited: 'workStatus.visited',
  booked: 'workStatus.booked',
  closed_deal: 'workStatus.closed_deal',
  customer_cancelled: 'workStatus.customer_cancelled',
}

export default function VisitRequestsIndex() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: [AdminService.QUERY_KEYS.BOOKINGS],
    queryFn: AdminService.listBookings,
  })

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return bookings
    return bookings.filter((b) => {
      const hay = `${b.userName ?? ''} ${b.propertyTitle ?? ''} ${b.agentName ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [bookings, searchQuery])

  return (
    <PageContainer size="7xl">
      <PageTitle
        title={t('sidebar.visitRequests')}
        subtitle={t('admin.visitRequestsSubtitle')}
      />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title={t('admin.noVisitRequests')}
          description={t('admin.noVisitRequestsDesc')}
        />
      ) : (
        <>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.visitRequestsSearchPlaceholder')}
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {t('agent.visitRequestsCount', { count: filtered.length })}
          </p>
          {filtered.length === 0 ? (
            <EmptyState
              title={t('admin.visitRequestsNoMatches')}
              description={t('agent.visitRequestsNoMatchesDesc')}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((booking) => {
                const phone = booking.phone || booking.userPhone || booking.latestContact
                const workKey = booking.workStatus
                  ? WORK_STATUS_KEY[booking.workStatus]
                  : null
                return (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{booking.userName ?? '-'}</span>
                            <BookingStatusBadge status={booking.status} />
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {phone}
                              </span>
                            )}
                            {booking.lineId && (
                              <span className="inline-flex items-center gap-1">
                                <MessageCircle className="h-3.5 w-3.5" />
                                {booking.lineId}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDateTime(booking.appointmentDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-foreground">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{booking.propertyTitle ?? `#${booking.propertyId}`}</span>
                            {booking.propertyCode && (
                              <span className="ml-1 text-xs text-muted-foreground font-mono">
                                {booking.propertyCode}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <UserCog className="h-3.5 w-3.5" />
                            <span>{t('admin.agentLabel')}:</span>
                            <span className="text-foreground">{booking.agentName ?? '-'}</span>
                          </div>
                          {booking.note && (
                            <p className="text-sm text-muted-foreground pt-1 border-t border-border mt-2">
                              {booking.note}
                            </p>
                          )}
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                          {workKey ? (
                            <Badge variant="outline">{t(workKey)}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              {t('workStatus.notSet')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </PageContainer>
  )
}
