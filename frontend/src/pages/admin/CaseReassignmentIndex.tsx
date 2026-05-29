import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeftRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdminService } from '@/services/AdminService'
import { BookingService } from '@/services/BookingService'
import { BookingStatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/utils/date'

export default function CaseReassignmentIndex() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedAgentId, setSelectedAgentId] = useState<Record<number, string>>({})

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: [BookingService.QUERY_KEYS.LIST],
    queryFn: BookingService.list,
  })

  const { data: agents = [] } = useQuery({
    queryKey: [AdminService.QUERY_KEYS.AGENTS],
    queryFn: AdminService.getAgents,
  })

  const reassignMutation = useMutation({
    mutationFn: ({ bookingId, newAgentId }: { bookingId: number; newAgentId: string }) =>
      AdminService.reassignCase(bookingId, newAgentId),
    onSuccess: (_data, vars) => {
      toast.success(t('admin.reassignSuccess'))
      queryClient.invalidateQueries({ queryKey: [BookingService.QUERY_KEYS.LIST] })
      setSelectedAgentId((prev) => {
        const next = { ...prev }
        delete next[vars.bookingId]
        return next
      })
    },
    onError: () => toast.error(t('common.error')),
  })

  const agentOptions = agents.filter((a) => a.role === 'agent')
  const activeCases = bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'completed')

  if (isLoading) return <LoadingSpinner text={t('common.loading')} />

  return (
    <div className="max-w-5xl mx-auto">
      <PageTitle title={t('admin.reassignTitle')} subtitle={t('admin.reassignSubtitle')} />

      {activeCases.length === 0 ? (
        <EmptyState title={t('admin.noCases')} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.customerCol')}</TableHead>
                  <TableHead>{t('admin.propertyCol')}</TableHead>
                  <TableHead>{t('admin.appointmentCol')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('admin.currentAgent')}</TableHead>
                  <TableHead>{t('admin.transferTo')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCases.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.userName ?? `User #${booking.userId}`}</TableCell>
                    <TableCell>{booking.propertyTitle ?? `#${booking.propertyId}`}</TableCell>
                    <TableCell>{formatDateTime(booking.appointmentDate)}</TableCell>
                    <TableCell><BookingStatusBadge status={booking.status} /></TableCell>
                    <TableCell>{booking.agentName ?? '-'}</TableCell>
                    <TableCell>
                      <Select
                        value={selectedAgentId[booking.id] ?? ''}
                        onValueChange={(v) => setSelectedAgentId((prev) => ({ ...prev, [booking.id]: v }))}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder={t('admin.selectAgent')} />
                        </SelectTrigger>
                        <SelectContent>
                          {agentOptions.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="outline" disabled={!selectedAgentId[booking.id]}>
                            <ArrowLeftRight className="h-4 w-4 mr-1" />
                            {t('admin.transfer')}
                          </Button>
                        }
                        title={t('admin.confirmTransferTitle')}
                        description={t('admin.confirmTransferDesc')}
                        confirmLabel={t('admin.confirmTransferBtn')}
                        onConfirm={() => reassignMutation.mutate({ bookingId: booking.id, newAgentId: selectedAgentId[booking.id] })}
                      />
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
