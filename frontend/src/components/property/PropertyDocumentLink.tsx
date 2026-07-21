import { useTranslation } from 'react-i18next'
import { FolderOpen } from 'lucide-react'

export function PropertyDocumentLink({ url }: { url?: string }) {
  const { t } = useTranslation()

  if (!url) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground">
        <FolderOpen className="size-3.5" />
        {t('property.noDocumentUrl')}
      </span>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
    >
      <FolderOpen className="size-3.5" />
      {t('property.openDocumentUrl')}
    </a>
  )
}
