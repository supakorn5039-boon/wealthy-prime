import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { ColumnDef } from '@tanstack/react-table'
import { AdminService } from '@/services/AdminService'
import { PropertyService } from '@/services/PropertyService'
import { PropertyStatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { DataTable } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice, formatDateTime } from '@/utils/date'
import type { Property, PropertyKind } from '@/types/Property'

type KindKey = Exclude<PropertyKind, '' | undefined>

const KINDS: KindKey[] = ['condo', 'house', 'townhouse']

const KIND_COLORS: Record<KindKey, string> = {
  condo: '#3b82f6',
  house: '#10b981',
  townhouse: '#f59e0b',
}

export default function AdminDashboardIndex() {
  const { t } = useTranslation()

  const { data: properties = [], isLoading: propsLoading } = useQuery({
    queryKey: ['admin-properties', 'dashboard'],
    queryFn: () => PropertyService.getAdminProperties(),
  })

  const { data: bookings = [] } = useQuery({
    queryKey: [AdminService.QUERY_KEYS.BOOKINGS],
    queryFn: AdminService.listBookings,
  })

  const kindBreakdown = useMemo(() => {
    const counts: Record<KindKey, number> = { condo: 0, house: 0, townhouse: 0 }
    for (const p of properties) {
      const k = p.kind as KindKey | undefined
      if (k && k in counts) counts[k]++
    }
    return KINDS.map((k) => ({
      kind: k,
      name: t(`property.kind.${k}`),
      value: counts[k],
      color: KIND_COLORS[k],
    }))
  }, [properties, t])

  const recentRequests = useMemo(() => {
    return [...bookings]
      .sort(
        (a, b) =>
          new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime(),
      )
      .slice(0, 6)
  }, [bookings])

  const total = kindBreakdown.reduce((sum, s) => sum + s.value, 0)

  const columns = useMemo<ColumnDef<Property>[]>(
    () => [
      {
        id: 'property',
        accessorFn: (row) => row.projectName,
        header: t('property.projectName'),
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <Link
              to={`/property/${row.original.id}`}
              className="font-medium truncate hover:underline"
            >
              {row.original.projectName}
            </Link>
            {row.original.propertyCode && (
              <span className="text-xs text-muted-foreground font-mono">
                {row.original.propertyCode}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'kind',
        accessorFn: (row) => row.kind ?? '',
        header: t('property.kindLabel'),
        cell: ({ row }) =>
          row.original.kind ? (
            <Badge variant="outline">{t(`property.kind.${row.original.kind}`)}</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: t('property.statusCol'),
        cell: ({ row }) => <PropertyStatusBadge status={row.original.status} />,
      },
      {
        id: 'price',
        accessorFn: (row) => row.price,
        header: t('property.price'),
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{formatPrice(row.original.price)}</span>
        ),
      },
    ],
    [t],
  )

  if (propsLoading) {
    return (
      <PageContainer size="7xl">
        <PageTitle title={t('admin.dashboardTitle')} subtitle={t('admin.dashboardSubtitle')} />
        <LoadingSpinner text={t('common.loading')} />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="7xl" className="space-y-6">
      <PageTitle title={t('admin.dashboardTitle')} subtitle={t('admin.dashboardSubtitle')} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold">{t('admin.propertiesTable')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={properties}
            searchPlaceholder={t('property.searchPlaceholder')}
            emptyMessage={t('admin.noData')}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">{t('admin.total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="relative h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={total > 0 ? kindBreakdown : [{ name: '', value: 1, color: '#e5e7eb' }]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={kindBreakdown.filter((s) => s.value > 0).length > 1 ? 2 : 0}
                      isAnimationActive={total > 0}
                    >
                      {(total > 0 ? kindBreakdown : [{ color: '#e5e7eb' }]).map((s, i) => (
                        <Cell key={i} fill={s.color} />
                      ))}
                    </Pie>
                    {total > 0 && <Tooltip />}
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <Home className="size-5 text-muted-foreground mb-1" />
                  <div className="text-3xl font-bold leading-none">{total.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('admin.total')}
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                  {t('admin.kindBreakdown')}
                </p>
                {kindBreakdown.map((s) => {
                  const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
                  return (
                    <div key={s.kind} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="truncate">{s.name}</span>
                      </div>
                      <div className="flex items-baseline gap-2 shrink-0">
                        <span className="font-semibold tabular-nums">{s.value}</span>
                        <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">{t('admin.propertyRequests')}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('admin.noRequests')}
              </p>
            ) : (
              <ul className="space-y-1">
                {recentRequests.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start gap-3 p-2 rounded hover:bg-muted/40"
                  >
                    <div className="size-9 rounded bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {r.propertyTitle ?? `#${r.propertyId}`}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="size-3" />
                        {formatDateTime(r.appointmentDate)}
                      </div>
                      {r.userName && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {r.userName}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
