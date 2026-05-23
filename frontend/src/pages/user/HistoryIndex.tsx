import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookingService } from '@/services/BookingService'
import { BookingStatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/utils/date'

export default function HistoryIndex() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: [BookingService.QUERY_KEYS.LIST],
    queryFn: BookingService.list,
  })

  const cancelMutation = useMutation({
    mutationFn: BookingService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BookingService.QUERY_KEYS.LIST] })
      toast.success(t('history.cancelled'))
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <div className="max-w-5xl mx-auto">
      <PageTitle title={t('history.title')} subtitle={t('history.subtitle')} />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title={t('history.empty')}
          description={t('history.emptyDesc')}
          actions={<Link to="/"><Button variant="outline">{t('home.title')}</Button></Link>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('agent.propertyCol')}</TableHead>
                  <TableHead>{t('agent.appointmentDate')}</TableHead>
                  <TableHead>{t('role.agent')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.propertyTitle ?? `#${booking.propertyId}`}</TableCell>
                    <TableCell>{formatDateTime(booking.appointmentDate)}</TableCell>
                    <TableCell>{booking.assignedAgentName ?? '-'}</TableCell>
                    <TableCell><BookingStatusBadge status={booking.status} /></TableCell>
                    <TableCell className="text-right">
                      {booking.status === 'pending' && (
                        <ConfirmDialog
                          trigger={<Button size="sm" variant="outline" className="text-red-500">{t('common.cancel')}</Button>}
                          title={t('history.confirmCancelTitle')}
                          description={t('history.confirmCancelDesc')}
                          confirmLabel={t('history.confirmCancelBtn')}
                          destructive
                          onConfirm={() => cancelMutation.mutate(booking.id)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
