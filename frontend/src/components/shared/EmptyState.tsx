import { InboxIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  description?: string
  className?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  className,
  icon,
  actions,
}: EmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      <div className="text-muted-foreground">
        {icon ?? <InboxIcon className="h-12 w-12 opacity-30" />}
      </div>
      <p className="text-lg font-medium text-gray-700">{title ?? t('common.noData')}</p>
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      {actions && <div className="mt-2">{actions}</div>}
    </div>
  )
}
