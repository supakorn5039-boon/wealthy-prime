import { useState } from 'react'
import { UserCog, Phone, Mail, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ListingAgentPreview } from '@/types/Booking'

interface Props {
  preview: ListingAgentPreview
  // When true, render as a full-width primary-looking outline button (right-rail
  // CTA style). Defaults to compact inline pill (used in contact lists).
  fullWidth?: boolean
}

// Lets an assigned agent reveal the listing agent's contact info when the
// underlying property was listed by someone else. Hidden behind a click so
// the contacts row stays compact for the common case.
export function ListingAgentPreviewDialog({ preview, fullWidth }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

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
        {t('agent.listingAgentPreview')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('agent.listingAgentTitle')}</DialogTitle>
            <DialogDescription>{t('agent.listingAgentDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="font-medium text-base">{preview.name}</div>
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
