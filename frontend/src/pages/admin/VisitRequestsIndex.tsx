import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { User, Phone, MessageCircle, Calendar, Search, UserCog, StickyNote } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdminService } from '@/services/AdminService'
import { WorkStatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { MissedContactBadge } from '@/components/shared/MissedContactBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MultiSelectFilter } from '@/components/shared/MultiSelectFilter'
import { DateRangeFilter, EMPTY_DATE_RANGE, matchesDateRange, type DateRangeValue } from '@/components/shared/DateRangeFilter'
import { PropertyDocumentLink } from '@/components/property/PropertyDocumentLink'
import {
  ADMIN_WORK_STATUS_FILTER_OPTIONS,
  workStatusFilterValue,
  type WorkStatusFilterValue,
} from '@/constants/WorkStatus'
import { formatDateTime } from '@/utils/date'

export default function VisitRequestsIndex() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<WorkStatusFilterValue[]>([])
  const [dateRange, setDateRange] = useState<DateRangeValue>(EMPTY_DATE_RANGE)
  const [agentFilters, setAgentFilters] = useState<string[]>([])
  const [projectFilters, setProjectFilters] = useState<string[]>([])

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: [AdminService.QUERY_KEYS.BOOKINGS],
    queryFn: AdminService.listBookings,
  })

  const agentOptions = useMemo(() => {
    const set = new Set<string>()
    for (const b of bookings) if (b.agentName) set.add(b.agentName)
    return Array.from(set).sort()
  }, [bookings])

  const projectOptions = useMemo(() => {
    const set = new Set<string>()
    for (const b of bookings) if (b.propertyTitle) set.add(b.propertyTitle)
    return Array.from(set).sort()
  }, [bookings])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return bookings.filter((b) => {
      if (statusFilters.length && !statusFilters.includes(workStatusFilterValue(b.workStatus))) return false
      if (!matchesDateRange(b.appointmentDate, dateRange)) return false
      if (agentFilters.length && !(b.agentName && agentFilters.includes(b.agentName))) return false
      if (projectFilters.length && !(b.propertyTitle && projectFilters.includes(b.propertyTitle))) return false
      if (!q) return true
      const hay = `${b.userName ?? ''} ${b.propertyTitle ?? ''} ${b.agentName ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [bookings, searchQuery, statusFilters, dateRange, agentFilters, projectFilters])

  const statusOptions = ADMIN_WORK_STATUS_FILTER_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))

  const header = (
    <PageTitle
      title={t('sidebar.visitRequests')}
      subtitle={t('admin.visitRequestsSubtitle')}
    />
  )

  if (isLoading) {
    return (
      <PageContainer size="7xl">
        {header}
        <LoadingSpinner text={t('common.loading')} />
      </PageContainer>
    )
  }

  if (bookings.length === 0) {
    return (
      <PageContainer size="7xl">
        {header}
        <EmptyState
          title={t('admin.noVisitRequests')}
          description={t('admin.noVisitRequestsDesc')}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="7xl">
      {header}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-3">
        <div className="relative md:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.visitRequestsSearchPlaceholder')}
            className="pl-9"
          />
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <MultiSelectFilter
          placeholder={t('filters.workStatus')}
          selected={statusFilters}
          options={statusOptions}
          onChange={(next) => setStatusFilters(next as WorkStatusFilterValue[])}
        />
        <MultiSelectFilter
          placeholder={t('admin.agentLabel')}
          selected={agentFilters}
          options={agentOptions.map((a) => ({ value: a, label: a }))}
          onChange={(next) => setAgentFilters(next as string[])}
        />
        <MultiSelectFilter
          placeholder={t('property.projectName')}
          selected={projectFilters}
          options={projectOptions.map((p) => ({ value: p, label: p }))}
          onChange={(next) => setProjectFilters(next as string[])}
        />
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {t('admin.visitRequestsCount', { count: filtered.length })}
      </p>
      {filtered.length === 0 ? (
        <EmptyState
          title={t('admin.visitRequestsNoMatches')}
          description={t('admin.visitRequestsNoMatchesDesc')}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const phone = booking.phone || booking.userPhone || booking.latestContact
            return (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-foreground">
                          {booking.propertyTitle ?? `#${booking.propertyId}`}
                        </h3>
                        {booking.propertyCode && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {booking.propertyCode}
                          </span>
                        )}
                        <MissedContactBadge booking={booking} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <User className="size-4 text-muted-foreground" />
                        <span className="font-medium">{booking.userName ?? '-'}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3.5" />
                            {phone}
                          </span>
                        )}
                        {booking.lineId && (
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="size-3.5" />
                            {booking.lineId}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {formatDateTime(booking.appointmentDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <UserCog className="size-3.5" />
                        <span>{t('admin.agentLabel')}:</span>
                        <span className="text-foreground">{booking.agentName ?? '-'}</span>
                      </div>
                      {booking.note && (
                        <div className="flex items-start gap-2 pt-2 mt-2 border-t border-border text-sm">
                          <StickyNote className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-muted-foreground font-medium mr-1">{t('contacts.note')}</span>
                            <span className="text-foreground whitespace-pre-wrap">{booking.note}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      <WorkStatusBadge workStatus={booking.workStatus} />
                      <PropertyDocumentLink url={booking.propertyDocumentUrl} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
