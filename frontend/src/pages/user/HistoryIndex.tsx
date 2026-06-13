import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { type ColumnDef } from '@tanstack/react-table'
import { BookingService } from '@/services/BookingService'
import type { Booking } from '@/types/Booking'
import { BookingStatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageContainer } from '@/components/shared/PageContainer'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateTime } from '@/utils/date'

export default function HistoryIndex() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: [BookingService.QUERY_KEYS.LIST],
    queryFn: BookingService.list,
  })

  const { mutate: cancelBooking } = useMutation({
    mutationFn: BookingService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BookingService.QUERY_KEYS.LIST] })
      toast.success(t('history.cancelled'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const columns = useMemo<ColumnDef<Booking, unknown>[]>(
    () => [
      {
        accessorKey: 'propertyTitle',
        header: t('agent.propertyCol'),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.propertyTitle ?? `#${row.original.propertyId}`}</span>
        ),
      },
      {
        accessorKey: 'appointmentDate',
        header: t('agent.appointmentDate'),
        cell: ({ row }) => formatDateTime(row.original.appointmentDate),
        sortingFn: 'datetime',
      },
      {
        accessorKey: 'agentName',
        header: t('role.agent'),
        cell: ({ row }) => row.original.agentName ?? '-',
      },
      {
        accessorKey: 'status',
        header: t('common.status'),
        cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('common.actions')}</span>,
        enableSorting: false,
        cell: ({ row }) => {
          if (row.original.status !== 'pending') return null
          return (
            <ConfirmDialog
              trigger={
                <Button size="sm" variant="outline" className="text-red-500">
                  {t('common.cancel')}
                </Button>
              }
              title={t('history.confirmCancelTitle')}
              description={t('history.confirmCancelDesc')}
              confirmLabel={t('history.confirmCancelBtn')}
              destructive
              onConfirm={() => cancelBooking(row.original.id)}
            />
          )
        },
      },
    ],
    [t, cancelBooking],
  )

  return (
    <PageContainer size="7xl">
      <PageTitle title={t('history.title')} subtitle={t('history.subtitle')} />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title={t('history.empty')}
          description={t('history.emptyDesc')}
          actions={
            <Link to="/">
              <Button variant="outline">{t('home.title')}</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-4">
            <DataTable
              columns={columns}
              data={bookings}
              searchPlaceholder={t('history.searchPlaceholder')}
              searchColumn="propertyTitle"
              pageSize={10}
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
