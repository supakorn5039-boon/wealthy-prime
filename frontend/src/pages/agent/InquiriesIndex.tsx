import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { InquiryService } from '@/services/InquiryService'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/utils/date'

export default function InquiriesIndex() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: [InquiryService.QUERY_KEYS.AGENT_INQUIRIES],
    queryFn: InquiryService.getAgentInquiries,
  })

  const markContacted = useMutation({
    mutationFn: (id: number) => InquiryService.updateStatus(id, 'contacted'),
    onSuccess: () => {
      toast.success(t('inquiries.markedContacted'))
      queryClient.invalidateQueries({ queryKey: [InquiryService.QUERY_KEYS.AGENT_INQUIRIES] })
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <PageContainer size="7xl">
      <PageTitle title={t('inquiries.title')} subtitle={t('inquiries.subtitle')} />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : inquiries.length === 0 ? (
        <EmptyState title={t('inquiries.empty')} description={t('inquiries.emptyDesc')} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('inquiries.customerCol')}</TableHead>
                  <TableHead>{t('inquiries.propertyCol')}</TableHead>
                  <TableHead>{t('inquiries.messageCol')}</TableHead>
                  <TableHead>{t('inquiries.submittedCol')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{inquiry.name}</p>
                        <a
                          href={`tel:${inquiry.phone}`}
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="h-3 w-3" />
                          {inquiry.phone}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>{inquiry.propertyTitle ?? `#${inquiry.propertyId}`}</TableCell>
                    <TableCell className="max-w-[280px]">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {inquiry.message || <span className="text-gray-300">-</span>}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDateTime(inquiry.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={inquiry.status === 'contacted' ? 'success' : 'warning'}>
                        {t(`inquiries.status${inquiry.status === 'contacted' ? 'Contacted' : 'New'}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {inquiry.status === 'new' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markContacted.mutate(inquiry.id)}
                          disabled={markContacted.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {t('inquiries.markContacted')}
                        </Button>
                      )}
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
