import { useTranslation } from 'react-i18next'
import { PageTitle } from '@/components/shared/PageTitle'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageContainer } from '@/components/shared/PageContainer'

export default function AgentOverviewIndex() {
  const { t } = useTranslation()

  return (
    <PageContainer size="5xl">
      <PageTitle title={t('agent.overviewTitle')} subtitle={t('agent.overviewSubtitle')} />
      <EmptyState title={t('common.noData')} />
    </PageContainer>
  )
}
