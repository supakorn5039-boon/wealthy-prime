import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookingService } from '@/services/BookingService'
import { BookingStatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateTime } from '@/utils/date'

export default function ContactsIndex() {
  const { t } = useTranslation()

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: [BookingService.QUERY_KEYS.LIST],
    queryFn: BookingService.list,
  })

  const contacted = bookings.filter((b) => b.assignedAgentId)

  return (
    <PageContainer size="4xl">
      <PageTitle title={t('contacts.title')} subtitle={t('contacts.subtitle')} />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : contacted.length === 0 ? (
        <EmptyState
          title={t('contacts.empty')}
          description={t('contacts.emptyDesc')}
          actions={<Link to="/"><Button variant="outline">{t('home.title')}</Button></Link>}
        />
      ) : (
        <div className="space-y-4">
          {contacted.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-semibold text-foreground">
                      {booking.propertyTitle ?? `${t('contacts.property')} #${booking.propertyId}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('contacts.appointmentDate')} {formatDateTime(booking.appointmentDate)}
                    </p>
                    {booking.agentName && (
                      <p className="text-sm text-primary">{t('contacts.agentLabel')} {booking.agentName}</p>
                    )}
                    {booking.note && (
                      <p className="text-sm text-muted-foreground bg-muted/40 rounded p-2 mt-2">
                        {t('contacts.note')} {booking.note}
                      </p>
                    )}
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
