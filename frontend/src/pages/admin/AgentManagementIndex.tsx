import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, UserCheck } from 'lucide-react'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { AdminService } from '@/services/AdminService'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FormInput } from '@/components/form/FormInput'
import { FormPhoneInput } from '@/components/form/FormPhoneInput'
import { FormSelect } from '@/components/form/FormSelect'
import { requiredLoosePhoneSchema } from '@/dto/AuthValidation'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { formatDate } from '@/utils/date'
import type { AuthUser } from '@/types/Auth'

const editAgentSchema = z.object({
  name: z.string().min(1),
  phone: requiredLoosePhoneSchema,
  role: z.enum(['user', 'agent', 'admin']),
})
type EditAgentSchema = z.infer<typeof editAgentSchema>

function EditAgentModal({ agent, open, onClose }: { agent: AuthUser; open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const roleOptions = [
    { value: 'user', label: t('role.user') },
    { value: 'agent', label: t('role.agent') },
    { value: 'admin', label: t('role.admin') },
  ]

  const { control, handleSubmit } = useForm<EditAgentSchema>({
    resolver: zodResolver(editAgentSchema),
    defaultValues: { name: agent.name, phone: agent.phone, role: agent.role as EditAgentSchema['role'] },
  })

  const mutation = useMutation({
    mutationFn: (values: EditAgentSchema) => AdminService.updateAgent(agent.id, values),
    onSuccess: () => {
      toast.success(t('admin.updateSuccess'))
      queryClient.invalidateQueries({ queryKey: [AdminService.QUERY_KEYS.AGENTS] })
      onClose()
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.editTitle')} {agent.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values), scrollToFirstError)} className="space-y-4">
          <FormInput control={control} name="name" label={t('admin.nameLabel')} required />
          <FormPhoneInput control={control} name="phone" label={t('admin.phoneLabel')} required />
          <FormSelect control={control} name="role" label={t('admin.roleLabel')} options={roleOptions} required />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
      <PageTitle title={t('admin.agentsTitle')} subtitle={`${agents.length} ${t('admin.people')}`} />

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
        <EditAgentModal agent={editingAgent} open={!!editingAgent} onClose={() => setEditingAgent(null)} />
      )}
    </PageContainer>
  )
}
