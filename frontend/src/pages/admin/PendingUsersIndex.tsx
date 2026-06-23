import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle, XCircle, User, Phone, Mail, Calendar, IdCard } from 'lucide-react'
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
        <div className="space-y-3">
          {pendings.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="size-4 text-muted-foreground" />
                      <span className="font-medium">{u.name}</span>
                      <Badge variant={roleBadgeVariant(u.role)}>{t(`role.${u.role}`)}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="size-3.5" />
                        {u.email}
                      </span>
                      {u.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3.5" />
                          {u.phone}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {formatDate(u.createdAt)}
                      </span>
                    </div>
                    {u.agentCode && (
                      <div className="flex items-center gap-1 text-sm text-foreground">
                        <IdCard className="size-3.5 text-muted-foreground" />
                        <span className="font-mono text-xs">{u.agentCode}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <ConfirmDialog
                      trigger={
                        <Button size="sm" className="gap-1.5">
                          <CheckCircle className="size-4" />
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
                          <XCircle className="size-4" />
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
