import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdminService } from '@/services/AdminService'
import { PropertyService } from '@/services/PropertyService'
import { PropertyStatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice, formatDate } from '@/utils/date'
import { resolveImageUrl } from '@/utils/imageUrl'

export default function PendingApprovalsIndex() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: pendings = [], isLoading } = useQuery({
    queryKey: [AdminService.QUERY_KEYS.PENDING],
    queryFn: AdminService.getPending,
  })

  const approveMutation = useMutation({
    mutationFn: AdminService.approvePending,
    onSuccess: () => {
      toast.success(t('admin.approveSuccess'))
      queryClient.invalidateQueries({ queryKey: [AdminService.QUERY_KEYS.PENDING] })
      queryClient.invalidateQueries({ queryKey: [PropertyService.QUERY_KEYS.LIST] })
      queryClient.invalidateQueries({ queryKey: [PropertyService.QUERY_KEYS.AGENT_LIST] })
    },
    onError: () => toast.error(t('common.error')),
  })

  const rejectMutation = useMutation({
    mutationFn: AdminService.rejectPending,
    onSuccess: () => {
      toast.success(t('admin.rejectSuccess'))
      queryClient.invalidateQueries({ queryKey: [AdminService.QUERY_KEYS.PENDING] })
      queryClient.invalidateQueries({ queryKey: [PropertyService.QUERY_KEYS.LIST] })
      queryClient.invalidateQueries({ queryKey: [PropertyService.QUERY_KEYS.AGENT_LIST] })
    },
    onError: () => toast.error(t('common.error')),
  })

  if (isLoading) return <LoadingSpinner text={t('common.loading')} />

  return (
    <PageContainer size="5xl">
      <PageTitle
        title={t('admin.pendingTitle')}
        subtitle={`${pendings.length} ${t('admin.pendingCount')}`}
      />

      {pendings.length === 0 ? (
        <EmptyState title={t('admin.noPending')} description={t('admin.allProcessed')} />
      ) : (
        <div className="space-y-4">
          {pendings.map((pending) => (
            <Card key={pending.id}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{pending.title}</h3>
                      <PropertyStatusBadge status={pending.status} />
                    </div>
                    <div className="text-sm text-gray-600 space-y-0.5">
                      <p>{t('admin.projectLabel')}: {pending.projectName}</p>
                      <p>{t('admin.priceLabel')}: {formatPrice(pending.price)}</p>
                      <p>{t('admin.agentLabel')}: {pending.agentName}</p>
                      <p>{t('admin.submittedAt')}: {formatDate(pending.createdAt)}</p>
                    </div>
                    {pending.slipUrl && (
                      <a href={resolveImageUrl(pending.slipUrl)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t('admin.viewSlip')}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <ConfirmDialog
                      trigger={
                        <Button size="sm" className="gap-1.5">
                          <CheckCircle className="h-4 w-4" />
                          {t('admin.approve')}
                        </Button>
                      }
                      title={t('admin.confirmApproveTitle')}
                      description={t('admin.confirmApproveDesc', { title: pending.title })}
                      confirmLabel={t('admin.approve')}
                      onConfirm={() => approveMutation.mutate(pending.id)}
                    />
                    <ConfirmDialog
                      trigger={
                        <Button size="sm" variant="outline" className="gap-1.5 text-red-500 border-red-200">
                          <XCircle className="h-4 w-4" />
                          {t('admin.reject')}
                        </Button>
                      }
                      title={t('admin.confirmRejectTitle')}
                      description={t('admin.confirmRejectDesc')}
                      confirmLabel={t('admin.reject')}
                      destructive
                      onConfirm={() => rejectMutation.mutate(pending.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
