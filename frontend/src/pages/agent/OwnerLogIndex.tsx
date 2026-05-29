import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { Input } from '@/components/ui/input'

export default function OwnerLogIndex() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  return (
    <PageContainer size="5xl">
      <PageTitle title={t('agent.ownerLogTitle')} />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('agent.ownerLogSearch')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <p className="text-lg">{t('agent.ownerLogEmpty')}</p>
      </div>
    </PageContainer>
  )
}
