import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
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
import { EditProfileDialog } from '@/components/admin/EditProfileDialog'
import { formatDate } from '@/utils/date'
import type { AuthUser } from '@/types/Auth'

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
        <EditProfileDialog
          user={editingUser}
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          updateFn={AdminService.updateUser}
          queryKey={AdminService.QUERY_KEYS.USERS}
        />
      )}
    </PageContainer>
  )
}
