import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, User, Phone, MessageCircle, Calendar, MapPin } from 'lucide-react'
import { AgentService } from '@/services/AgentService'
import { BookingStatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WorkStatusSelect } from '@/components/agent/WorkStatusSelect'
import { formatDateTime } from '@/utils/date'

export default function LeadsIndex() {
  const { t } = useTranslation()

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: [AgentService.QUERY_KEYS.CONTACTS],
    queryFn: AgentService.getContacts,
  })

  return (
    <PageContainer size="7xl">
      <PageTitle
        title={t('agent.leadsTitle')}
        subtitle={t('agent.leadsSubtitle')}
        actions={
          <Button onClick={() => toast.info(t('common.phaseNext'))}>
            <Plus className="size-4 mr-2" />
            {t('agent.addLead')}
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : contacts.length === 0 ? (
        <EmptyState title={t('agent.noLeads')} />
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => {
            const phone = c.phone || c.userPhone || c.latestContact
            return (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="size-4 text-muted-foreground" />
                        <span className="font-medium">{c.userName ?? '-'}</span>
                        <BookingStatusBadge status={c.status} />
                        {/* TODO Phase Next: source badge (website/line) when backend exposes it */}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3.5" />
                            {phone}
                          </span>
                        )}
                        {c.lineId && (
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="size-3.5" />
                            {c.lineId}
                          </span>
                        )}
                        {c.appointmentDate && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            {formatDateTime(c.appointmentDate)}
                          </span>
                        )}
                      </div>
                      {c.propertyTitle && (
                        <div className="flex items-center gap-1 text-sm text-foreground">
                          <MapPin className="size-3.5 text-muted-foreground" />
                          <span>{c.propertyTitle}</span>
                          {c.propertyCode && (
                            <span className="ml-1 text-xs text-muted-foreground font-mono">{c.propertyCode}</span>
                          )}
                        </div>
                      )}
                      {/* TODO Phase Next: budget, area, description when Lead resource lands */}
                    </div>
                    <div className="shrink-0">
                      <WorkStatusSelect contact={c} />
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
