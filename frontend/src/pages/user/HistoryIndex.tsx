import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { type ColumnDef } from '@tanstack/react-table'
import { BookingService } from '@/services/BookingService'
import type { Booking } from '@/types/Booking'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateTime } from '@/utils/date'

function HeaderT({ k }: { k: string }) {
  const { t } = useTranslation()
  return <>{t(k)}</>
}

const HISTORY_COLUMNS: ColumnDef<Booking, unknown>[] = [
  {
    accessorKey: 'propertyTitle',
    header: () => <HeaderT k="agent.propertyCol" />,
    cell: ({ row }) => (
      <span className="font-medium">{row.original.propertyTitle ?? `#${row.original.propertyId}`}</span>
    ),
  },
  {
    accessorKey: 'appointmentDate',
    header: () => <HeaderT k="agent.appointmentDate" />,
    cell: ({ row }) => formatDateTime(row.original.appointmentDate),
    sortingFn: 'datetime',
  },
  {
    accessorKey: 'agentName',
    header: () => <HeaderT k="role.agent" />,
    cell: ({ row }) => row.original.agentName ?? '-',
  },
]

export default function HistoryIndex() {
  const { t } = useTranslation()

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: [BookingService.QUERY_KEYS.LIST],
    queryFn: BookingService.list,
  })

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
              columns={HISTORY_COLUMNS}
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
