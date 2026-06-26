import { useState } from 'react'
import { UserCog, Phone, Mail, MessageCircle, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ListingOwnerPreview } from '@/types/Property'

interface Props {
  preview: ListingOwnerPreview | null | undefined
  fullWidth?: boolean
}

export function ListingOwnerPreviewDialog({ preview, fullWidth }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const hasAny = !!preview && Object.values(preview).some(Boolean)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={fullWidth ? 'default' : 'sm'}
        onClick={() => setOpen(true)}
        className={fullWidth ? 'w-full' : ''}
      >
        <UserCog className={fullWidth ? 'size-4 mr-2' : 'size-3.5 mr-1'} />
        {t('agent.listingOwnerPreview')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('agent.listingOwnerTitle')}</DialogTitle>
            <DialogDescription>{t('agent.listingOwnerDesc')}</DialogDescription>
          </DialogHeader>
          {preview && hasAny ? (
            <div className="space-y-2 text-sm">
              {preview.name && <div className="font-medium text-base">{preview.name}</div>}
              {preview.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <a href={`tel:${preview.phone}`} className="hover:underline">{preview.phone}</a>
                </div>
              )}
              {preview.email && (
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-muted-foreground" />
                  <a href={`mailto:${preview.email}`} className="hover:underline">{preview.email}</a>
                </div>
              )}
              {preview.lineId && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-3.5 text-muted-foreground" />
                  <span>Line: {preview.lineId}</span>
                </div>
              )}
              {preview.whatsapp && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-3.5 text-muted-foreground" />
                  <span>WhatsApp: {preview.whatsapp}</span>
                </div>
              )}
              {preview.wechat && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-3.5 text-muted-foreground" />
                  <span>WeChat: {preview.wechat}</span>
                </div>
              )}
              {preview.facebook && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-3.5 text-muted-foreground" />
                  <span>Facebook: {preview.facebook}</span>
                </div>
              )}
              {preview.info && (
                <div className="flex items-start gap-2 pt-2 border-t">
                  <FileText className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="whitespace-pre-line">{preview.info}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('property.noOwnerInfoOnFile')}</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
