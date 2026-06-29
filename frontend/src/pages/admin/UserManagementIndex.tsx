import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FormInput } from '@/components/form/FormInput'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { formatDate } from '@/utils/date'
import type { AuthUser } from '@/types/Auth'

const editUserSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
})
type EditUserSchema = z.infer<typeof editUserSchema>

function EditUserModal({ user, open, onClose }: { user: AuthUser; open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { control, handleSubmit } = useForm<EditUserSchema>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: user.name, phone: user.phone },
  })

  const mutation = useMutation({
    mutationFn: (values: EditUserSchema) => AdminService.updateUser(user.id, values),
    onSuccess: () => {
      toast.success(t('admin.updateSuccess'))
      queryClient.invalidateQueries({ queryKey: [AdminService.QUERY_KEYS.USERS] })
      onClose()
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.editTitle')} {user.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values), scrollToFirstError)} className="space-y-4">
          <FormInput control={control} name="name" label={t('admin.nameLabel')} required />
          <FormInput control={control} name="phone" label={t('admin.phoneLabel')} required />
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

export default function UserManagementIndex() {
  const { t } = useTranslation()
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: [AdminService.QUERY_KEYS.USERS],
    queryFn: AdminService.getUsers,
  })

  const roleBadgeVariant = (role: AuthUser['role']) =>
    role === 'admin' ? 'destructive' : role === 'agent' ? 'default' : 'secondary'

  return (
    <PageContainer size="7xl">
      <PageTitle title={t('admin.usersTitle')} subtitle={`${users.length} ${t('admin.people')}`} />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : users.length === 0 ? (
        <EmptyState title={t('admin.noUsers')} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.email')}</TableHead>
                  <TableHead>{t('common.phone')}</TableHead>
                  <TableHead>{t('common.role')}</TableHead>
                  <TableHead>{t('common.createdAt')}</TableHead>
                  <TableHead className="text-right">{t('common.edit')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(u.role)}>{t(`role.${u.role}`)}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditingUser(u)}>
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

      {editingUser && (
        <EditUserModal user={editingUser} open={!!editingUser} onClose={() => setEditingUser(null)} />
      )}
    </PageContainer>
  )
}
