import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { AdminService } from '@/services/AdminService'
import { useDebounce } from '@/hooks/useDebounce'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { DataTable } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateTime } from '@/utils/date'
import type { AuditLog, AuditAction, AuditEntityType } from '@/types/AuditLog'
import type { UserRole } from '@/types/Auth'

const ACTION_VALUES: AuditAction[] = [
  'create',
  'update',
  'delete',
  'approve',
  'reject',
  'assign',
  'reassign',
  'status_change',
  'role_change',
  'note_update',
  'work_status_set',
  'view_owner',
]

const ENTITY_VALUES: AuditEntityType[] = [
  'user',
  'agent',
  'property',
  'booking',
  'inquiry',
  'review',
]

const ROLE_VALUES: UserRole[] = ['admin', 'agent', 'user']

function HeaderT({ k }: { k: string }) {
  const { t } = useTranslation()
  return <>{t(k)}</>
}

function ActionBadge({ a }: { a: AuditAction }) {
  const { t } = useTranslation()
  return (
    <Badge variant="outline" className={ACTION_TONE[a] ?? ''}>
      {t(`audit.actions.${a}`, a)}
    </Badge>
  )
}

function EntityLabel({ entityType, entityId }: { entityType: string; entityId: number | null }) {
  const { t } = useTranslation()
  return (
    <span className="text-sm">
      {t(`audit.entities.${entityType}`, entityType)}
      {entityId != null && (
        <span className="text-xs text-muted-foreground ml-1">#{entityId}</span>
      )}
    </span>
  )
}

const AUDIT_COLUMNS: ColumnDef<AuditLog>[] = [
  {
    id: 'when',
    accessorFn: (r) => r.createdAt,
    header: () => <HeaderT k="audit.when" />,
    cell: ({ row }) => (
      <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: 'actor',
    accessorFn: (r) => r.actorName,
    header: () => <HeaderT k="audit.actor" />,
    cell: ({ row }) => (
      <div className="flex flex-col min-w-0">
        <span className="font-medium truncate">{row.original.actorName || '-'}</span>
        {row.original.actorRole && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {row.original.actorRole}
          </span>
        )}
      </div>
    ),
  },
  {
    id: 'action',
    accessorFn: (r) => r.action,
    header: () => <HeaderT k="audit.action" />,
    cell: ({ row }) => <ActionBadge a={row.original.action} />,
  },
  {
    id: 'entity',
    accessorFn: (r) => r.entityType,
    header: () => <HeaderT k="audit.entity" />,
    cell: ({ row }) => (
      <EntityLabel entityType={row.original.entityType} entityId={row.original.entityId ?? null} />
    ),
  },
  {
    id: 'summary',
    accessorFn: (r) => r.summary,
    header: () => <HeaderT k="audit.summary" />,
    cell: ({ row }) => (
      <span className="text-sm text-foreground">{row.original.summary || '-'}</span>
    ),
  },
  {
    id: 'ip',
    accessorFn: (r) => r.ip,
    header: 'IP',
    cell: ({ row }) => (
      <span className="text-xs font-mono text-muted-foreground">
        {row.original.ip || '-'}
      </span>
    ),
  },
]

const ACTION_TONE: Record<AuditAction, string> = {
  create: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  update: 'bg-blue-50 text-blue-700 border-blue-300',
  delete: 'bg-rose-50 text-rose-700 border-rose-300',
  approve: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  reject: 'bg-rose-50 text-rose-700 border-rose-300',
  assign: 'bg-violet-50 text-violet-700 border-violet-300',
  reassign: 'bg-violet-50 text-violet-700 border-violet-300',
  status_change: 'bg-amber-50 text-amber-700 border-amber-300',
  role_change: 'bg-amber-50 text-amber-700 border-amber-300',
  note_update: 'bg-slate-50 text-slate-700 border-slate-300',
  work_status_set: 'bg-amber-50 text-amber-700 border-amber-300',
  view_owner: 'bg-cyan-50 text-cyan-700 border-cyan-300',
  login: 'bg-slate-50 text-slate-700 border-slate-300',
  password_reset: 'bg-slate-50 text-slate-700 border-slate-300',
}

export default function AuditLogsIndex() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [actorRole, setActorRole] = useState<string>('')
  const [action, setAction] = useState<string>('')
  const [entityType, setEntityType] = useState<string>('')
  const debouncedSearch = useDebounce(search, 300)

  const { data: logs = [], isLoading } = useQuery({
    queryKey: [
      AdminService.QUERY_KEYS.AUDIT_LOGS,
      { actorRole, action, entityType, search: debouncedSearch },
    ],
    queryFn: () =>
      AdminService.listAuditLogs({
        actorRole: (actorRole || undefined) as UserRole | undefined,
        action: (action || undefined) as AuditAction | undefined,
        entityType: (entityType || undefined) as AuditEntityType | undefined,
        search: debouncedSearch.trim() || undefined,
        limit: 300,
      }),
  })

  return (
    <PageContainer size="7xl" className="space-y-6">
      <PageTitle title={t('audit.title')} subtitle={t('audit.subtitle')} />

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
            <div className="relative md:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('audit.searchPlaceholder')}
                className="pl-9"
              />
            </div>
            <Select value={actorRole || 'all'} onValueChange={(v) => setActorRole(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('audit.actorRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('audit.allRoles')}</SelectItem>
                {ROLE_VALUES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={action || 'all'} onValueChange={(v) => setAction(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('audit.action')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('audit.allActions')}</SelectItem>
                {ACTION_VALUES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {t(`audit.actions.${a}`, a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityType || 'all'} onValueChange={(v) => setEntityType(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('audit.entity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('audit.allEntities')}</SelectItem>
                {ENTITY_VALUES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {t(`audit.entities.${e}`, e)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <LoadingSpinner text={t('common.loading')} />
          ) : (
            <DataTable
              columns={AUDIT_COLUMNS}
              data={logs}
              searchPlaceholder={t('audit.searchPlaceholder')}
              emptyMessage={t('audit.noData')}
              pageSize={25}
            />
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
