import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdminService } from '@/services/AdminService'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MultiSelectFilter } from '@/components/shared/MultiSelectFilter'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EditProfileDialog } from '@/components/admin/EditProfileDialog'
import { formatDate } from '@/utils/date'
import type { AuthUser, UserRole } from '@/types/Auth'

const ROLE_VALUES: UserRole[] = ['user', 'agent', 'admin']

export default function UserManagementIndex() {
  const { t } = useTranslation()
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilters, setRoleFilters] = useState<UserRole[]>([])

  const { data: users = [], isLoading } = useQuery({
    queryKey: [AdminService.QUERY_KEYS.USERS],
    queryFn: AdminService.getUsers,
  })

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilters.length && !roleFilters.includes(u.role)) return false
      if (!q) return true
      return `${u.name ?? ''} ${u.email ?? ''}`.toLowerCase().includes(q)
    })
  }, [users, searchQuery, roleFilters])

  const roleOptions = ROLE_VALUES.map((r) => ({ value: r, label: t(`role.${r}`) }))

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
        <>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('admin.userSearchPlaceholder')}
                className="pl-9"
              />
            </div>
            <MultiSelectFilter
              placeholder={t('common.role')}
              selected={roleFilters}
              options={roleOptions}
              onChange={(next) => setRoleFilters(next as UserRole[])}
              className="sm:w-44"
            />
          </div>
          {filteredUsers.length === 0 ? (
            <EmptyState title={t('admin.noUserMatches')} description={t('admin.noUserMatchesDesc')} />
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
                    {filteredUsers.map((u) => (
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
        </>
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
