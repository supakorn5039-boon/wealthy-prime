import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link2, Copy, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AgentService } from '@/services/AgentService'
import { PropertyService } from '@/services/PropertyService'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/utils/date'

export default function ReviewLinkIndex() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')

  const { data: properties = [] } = useQuery({
    queryKey: [PropertyService.QUERY_KEYS.AGENT_LIST],
    queryFn: PropertyService.getAgentProperties,
  })

  const { data: links = [], isLoading } = useQuery({
    queryKey: [AgentService.QUERY_KEYS.REVIEW_LINKS],
    queryFn: AgentService.getReviewLinks,
  })

  const genMutation = useMutation({
    mutationFn: () => AgentService.generateReviewLink(selectedPropertyId),
    onSuccess: () => {
      toast.success(t('agent.linkCreated'))
      queryClient.invalidateQueries({ queryKey: [AgentService.QUERY_KEYS.REVIEW_LINKS] })
      setSelectedPropertyId('')
    },
    onError: () => toast.error(t('common.error')),
  })

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => toast.success(t('agent.linkCopied')))
  }

  return (
    <PageContainer size="3xl">
      <PageTitle title={t('agent.reviewLinkTitle')} subtitle={t('agent.reviewLinkSubtitle')} />

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">{t('agent.newLink')}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t('agent.selectProperty')} />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => genMutation.mutate()}
              disabled={!selectedPropertyId || genMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${genMutation.isPending ? 'animate-spin' : ''}`} />
              {t('agent.generateLink')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-3">{t('agent.createdLinks')}</h2>
        {isLoading ? (
          <LoadingSpinner />
        ) : links.length === 0 ? (
          <EmptyState
            title={t('agent.noLinks')}
            description={t('agent.noLinksDesc')}
            icon={<Link2 className="h-12 w-12 opacity-30" />}
          />
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <Card key={link.token}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{link.propertyTitle}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{link.url}</p>
                      {link.expiresAt && (
                        <p className="text-xs text-orange-500 mt-0.5">{t('agent.expiresAt')} {formatDate(link.expiresAt)}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyLink(link.url)}
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4 mr-1.5" />
                      {t('agent.copy')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
