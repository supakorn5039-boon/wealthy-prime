import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Building2, Users, UserCog, DollarSign, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdminService } from '@/services/AdminService'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/utils/date'

const COLORS = ['#C9A24A', '#D4B26E', '#A88334', '#7A5F22']

const RANK_BADGE: Record<number | 'default', string> = {
  0: 'bg-primary text-primary-foreground',
  1: 'bg-accent text-accent-foreground',
  2: 'bg-primary/60 text-primary-foreground',
  default: 'bg-muted text-muted-foreground',
}

function StatCard({ title, value, icon, sub }: { title: string; value: string | number; icon: React.ReactNode; sub?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardIndex() {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: [AdminService.QUERY_KEYS.DASHBOARD],
    queryFn: AdminService.getDashboard,
  })

  if (isLoading) return <LoadingSpinner text={t('common.loading')} />

  const chartData = (data?.propertyStatusChart ?? []).map((item) => ({
    ...item,
    label: t(`property.status.${item.status}`, { defaultValue: item.status }),
  }))

  return (
    <PageContainer size="7xl" className="space-y-6">
      <PageTitle title={t('admin.dashboardTitle')} subtitle={t('admin.dashboardSubtitle')} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('admin.total')} value={data?.totalProperties ?? 0} icon={<Building2 className="h-5 w-5" />} />
        <StatCard title={t('admin.users')} value={data?.totalUsers ?? 0} icon={<Users className="h-5 w-5" />} />
        <StatCard title={t('admin.agents')} value={data?.totalAgents ?? 0} icon={<UserCog className="h-5 w-5" />} />
        <StatCard title={t('admin.revenue')} value={formatPrice(data?.totalRevenue ?? 0)} icon={<DollarSign className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('admin.statusChart')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              {t('admin.agentRanking')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.agentLeaderboard ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('admin.noData')}</p>
            ) : (
              <div className="space-y-3">
                {data!.agentLeaderboard.map((agent, i) => (
                  <div key={agent.agentId} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${RANK_BADGE[i] ?? RANK_BADGE.default}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{agent.agentName}</p>
                    </div>
                    <div className="text-sm font-bold text-primary">{agent.closedCount} {t('admin.caseSuffix')}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
