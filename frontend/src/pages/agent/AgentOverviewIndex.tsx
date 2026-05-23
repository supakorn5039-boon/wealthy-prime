import { useTranslation } from 'react-i18next'
import { PageTitle } from '@/components/shared/PageTitle'
import { EmptyState } from '@/components/shared/EmptyState'

export default function AgentOverviewIndex() {
  const { t } = useTranslation()

  return (
    <div className="max-w-5xl mx-auto">
      <PageTitle title={t('agent.overviewTitle')} subtitle={t('agent.overviewSubtitle')} />
      <EmptyState title={t('common.noData')} />
    </div>
  )
}
