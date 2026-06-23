import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
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
import { formatPrice, formatDate } from '@/utils/date'

export default function FinancialIndex() {
  const { t } = useTranslation()

  const { data: records = [], isLoading } = useQuery({
    queryKey: [AdminService.QUERY_KEYS.FINANCIAL],
    queryFn: AdminService.getFinancial,
  })

  const exportMutation = useMutation({
    mutationFn: AdminService.exportFinancial,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financial-report-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t('admin.downloadSuccess'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const totalRevenue = records.reduce((sum, r) => sum + r.amount, 0)

  return (
    <PageContainer size="7xl">
      <PageTitle
        title={t('admin.financialTitle')}
        subtitle={`${t('admin.totalRevenue')}: ${formatPrice(totalRevenue)}`}
        actions={
          <Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
            <Download className="size-4 mr-2" />
            {exportMutation.isPending ? t('admin.exporting') : t('admin.export')}
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSpinner text={t('common.loading')} />
      ) : records.length === 0 ? (
        <EmptyState title={t('admin.noFinancial')} description={t('admin.noFinancialDesc')} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.propertyCol')}</TableHead>
                  <TableHead>{t('admin.agentLabel')}</TableHead>
                  <TableHead>{t('admin.typeCol')}</TableHead>
                  <TableHead>{t('admin.amountCol')}</TableHead>
                  <TableHead>{t('admin.closedAtCol')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.propertyTitle}</TableCell>
                    <TableCell>{record.agentName}</TableCell>
                    <TableCell>
                      <Badge variant={record.type === 'buy' ? 'info' : 'success'}>
                        {t(`property.${record.type}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">{formatPrice(record.amount)}</TableCell>
                    <TableCell>{formatDate(record.closedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-right text-muted-foreground">
                    {t('admin.financialSubtotal')}
                  </td>
                  <td className="px-4 py-3 text-base font-bold text-primary">{formatPrice(totalRevenue)}</td>
                  <td />
                </tr>
              </tfoot>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
