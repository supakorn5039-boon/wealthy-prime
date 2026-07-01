import { useQuery } from '@tanstack/react-query'
import { Building2, TrendingUp, Calendar, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AgentService } from '@/services/AgentService'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444']

function StatCard({ title, value, sub, icon, color }: { title: string; value: number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value.toLocaleString()}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function AgentDashboardIndex() {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: [AgentService.QUERY_KEYS.DASHBOARD],
    queryFn: AgentService.getDashboard,
  })

  const { data: contacts = [] } = useQuery({
    queryKey: [AgentService.QUERY_KEYS.CONTACTS],
    queryFn: AgentService.getContacts,
  })

  if (isLoading) return <LoadingSpinner text={t('common.loading')} />

  const pendingVisits = contacts.filter((c) => c.status === 'pending' || c.status === 'assigned').length

  const districtMap: Record<string, number> = {}
  contacts.forEach((c) => {
    const loc = c.propertyTitle ?? t('common.noData')
    districtMap[loc] = (districtMap[loc] ?? 0) + 1
  })
  const districtData = Object.entries(districtMap).slice(0, 6).map(([name, value]) => ({ name, value }))

  const typeData = [
    { name: t('property.listing.sell'), value: data?.sellListings ?? 0 },
    { name: t('property.listing.rent'), value: data?.rentListings ?? 0 },
    { name: t('property.listing.both'), value: data?.bothListings ?? 0 },
  ].filter((d) => d.value > 0)

  return (
    <PageContainer size="7xl" className="space-y-6">
      <PageTitle
        title={t('agent.welcome', { name: user?.name ?? '' })}
        subtitle={t('agent.subtitle')}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('agent.total')}
          value={data?.totalProperties ?? 0}
          icon={<Building2 className="size-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title={t('agent.available')}
          value={data?.availableProperties ?? 0}
          sub={t('agent.noRented')}
          icon={<TrendingUp className="size-5 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title={t('agent.visitRequests')}
          value={contacts.length}
          sub={`${pendingVisits} ${t('agent.pending')}`}
          icon={<Calendar className="size-5 text-yellow-600" />}
          color="bg-yellow-50"
        />
        <StatCard
          title={t('agent.leads')}
          value={contacts.length}
          icon={<Users className="size-5 text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">{t('agent.byDistrict')}</CardTitle>
          </CardHeader>
          <CardContent>
            {districtData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">{t('common.noData')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={districtData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: number) => [value, t('common.items')]} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">{t('agent.byType')}</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">{t('common.noData')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label>
                    {typeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
