import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AgentService } from '@/services/AgentService'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/date'

export default function LeadsIndex() {
  const { t } = useTranslation()

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: [AgentService.QUERY_KEYS.CONTACTS],
    queryFn: AgentService.getContacts,
  })

  return (
    <PageContainer size="5xl">
      <PageTitle title={t('agent.leadsTitle')} subtitle={t('agent.leadsSubtitle')} />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : contacts.length === 0 ? (
        <EmptyState title={t('agent.noLeads')} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.phone')}</TableHead>
                  <TableHead>{t('contacts.property')}</TableHead>
                  <TableHead>{t('agent.appointmentDate')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.userName}</TableCell>
                    <TableCell>{c.userPhone}</TableCell>
                    <TableCell>{c.propertyTitle}</TableCell>
                    <TableCell>{c.appointmentDate ? formatDate(c.appointmentDate) : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'cancelled' ? 'destructive' : c.status === 'completed' ? 'secondary' : 'outline'}>
                        {c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
