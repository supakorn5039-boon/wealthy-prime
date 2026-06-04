import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdminService } from '@/services/AdminService'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/date'
import type { AuthUser } from '@/types/Auth'

export default function PendingUsersIndex() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: pendings = [], isLoading } = useQuery({
    queryKey: [AdminService.QUERY_KEYS.PENDING_USERS],
    queryFn: AdminService.getPendingUsers,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [AdminService.QUERY_KEYS.PENDING_USERS] })
    queryClient.invalidateQueries({ queryKey: [AdminService.QUERY_KEYS.USERS] })
    queryClient.invalidateQueries({ queryKey: [AdminService.QUERY_KEYS.AGENTS] })
  }

  const approveMutation = useMutation({
    mutationFn: AdminService.approveUser,
    onSuccess: () => {
      toast.success(t('admin.userApproveSuccess'))
      invalidate()
    },
    onError: () => toast.error(t('common.error')),
  })

  const rejectMutation = useMutation({
    mutationFn: AdminService.rejectUser,
    onSuccess: () => {
      toast.success(t('admin.userRejectSuccess'))
      invalidate()
    },
    onError: () => toast.error(t('common.error')),
  })

  if (isLoading) return <LoadingSpinner text={t('common.loading')} />

  const roleBadgeVariant = (role: AuthUser['role']) =>
    role === 'agent' ? 'default' : 'secondary'

  return (
    <PageContainer size="7xl">
      <PageTitle
        title={t('admin.pendingUsersTitle')}
        subtitle={`${pendings.length} ${t('admin.pendingUsersCount')}`}
      />

      {pendings.length === 0 ? (
        <EmptyState title={t('admin.noPendingUsers')} description={t('admin.allUsersProcessed')} />
      ) : (
        <div className="space-y-4">
          {pendings.map((u) => (
            <Card key={u.id}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{u.name}</h3>
                      <Badge variant={roleBadgeVariant(u.role)}>{t(`role.${u.role}`)}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-0.5">
                      <p>{t('common.email')}: {u.email}</p>
                      <p>{t('common.phone')}: {u.phone}</p>
                      {u.agentCode && <p>{t('profile.agentCode')}: {u.agentCode}</p>}
                      <p>{t('admin.submittedAt')}: {formatDate(u.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <ConfirmDialog
                      trigger={
                        <Button size="sm" className="gap-1.5">
                          <CheckCircle className="h-4 w-4" />
                          {t('admin.approve')}
                        </Button>
                      }
                      title={t('admin.confirmApproveUserTitle')}
                      description={t('admin.confirmApproveUserDesc', { name: u.name })}
                      confirmLabel={t('admin.approve')}
                      onConfirm={() => approveMutation.mutate(u.id)}
                    />
                    <ConfirmDialog
                      trigger={
                        <Button size="sm" variant="outline" className="gap-1.5 text-red-500 border-red-200">
                          <XCircle className="h-4 w-4" />
                          {t('admin.reject')}
                        </Button>
                      }
                      title={t('admin.confirmRejectUserTitle')}
                      description={t('admin.confirmRejectUserDesc', { name: u.name })}
                      confirmLabel={t('admin.reject')}
                      destructive
                      onConfirm={() => rejectMutation.mutate(u.id)}
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
