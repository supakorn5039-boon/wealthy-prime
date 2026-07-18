import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, UserCheck, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdminService } from '@/services/AdminService'
import { ROUTES } from '@/constants/Routes'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EditProfileDialog } from '@/components/admin/EditProfileDialog'
import { formatDate } from '@/utils/date'
import type { AuthUser } from '@/types/Auth'

function AgentSignupLink() {
  const { t } = useTranslation()
  const url = `${window.location.origin}${ROUTES.REGISTER_AGENT}`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('common.error'))
    }
  }
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 p-3 sm:min-w-[22rem]">
      <span className="text-xs font-medium text-muted-foreground">{t('admin.agentSignupUrl')}</span>
      <div className="flex items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 truncate text-sm font-medium text-primary hover:underline"
        >
          {url}
        </a>
        <Button type="button" variant="outline" size="sm" onClick={copy} className="shrink-0">
          <Copy className="size-3.5 mr-1" />
          {t('common.copy')}
        </Button>
      </div>
    </div>
  )
}

export default function AgentManagementIndex() {
  const { t } = useTranslation()
  const [editingAgent, setEditingAgent] = useState<AuthUser | null>(null)

  const { data: agents = [], isLoading } = useQuery({
    queryKey: [AdminService.QUERY_KEYS.AGENTS],
    queryFn: AdminService.getAgents,
  })

  return (
    <PageContainer size="7xl">
      <PageTitle
        title={t('admin.agentsTitle')}
        subtitle={`${agents.length} ${t('admin.people')}`}
        actions={<AgentSignupLink />}
      />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : agents.length === 0 ? (
        <EmptyState title={t('admin.noAgents')} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.email')}</TableHead>
                  <TableHead>{t('common.phone')}</TableHead>
                  <TableHead>{t('admin.roleLabel')}</TableHead>
                  <TableHead>{t('common.createdAt')}</TableHead>
                  <TableHead className="text-right">{t('common.edit')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>{agent.email}</TableCell>
                    <TableCell>{agent.phone}</TableCell>
                    <TableCell>
                      <Badge variant={agent.role === 'admin' ? 'destructive' : agent.role === 'agent' ? 'secondary' : 'outline'}>
                        <UserCheck className="size-3 mr-1" />
                        {t(`role.${agent.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(agent.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditingAgent(agent)}>
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {editingAgent && (
        <EditProfileDialog
          user={editingAgent}
          open={!!editingAgent}
          onClose={() => setEditingAgent(null)}
          updateFn={AdminService.updateAgent}
          queryKey={AdminService.QUERY_KEYS.AGENTS}
        />
      )}
    </PageContainer>
  )
}
