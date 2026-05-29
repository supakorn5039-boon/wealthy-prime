import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/form/FormInput'
import { FormTextarea } from '@/components/form/FormTextarea'
import { InquiryService } from '@/services/InquiryService'
import { useAuthStore } from '@/store/authStore'

interface ContactAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: number
  propertyTitle: string
}

interface ContactFormValues {
  name: string
  phone: string
  message: string
}

export function ContactAgentDialog({ open, onOpenChange, propertyId, propertyTitle }: ContactAgentDialogProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const { control, handleSubmit, reset } = useForm<ContactFormValues>({
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '', message: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ name: user?.name ?? '', phone: user?.phone ?? '', message: '' })
    }
  }, [open, user, reset])

  const mutation = useMutation({
    mutationFn: (values: ContactFormValues) =>
      InquiryService.create({
        property_id: propertyId,
        name: values.name.trim(),
        phone: values.phone.trim(),
        message: values.message.trim(),
      }),
    onSuccess: () => {
      toast.success(t('property.contactSent'))
      onOpenChange(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('property.contactDialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('property.contactDialogDescription', { title: propertyTitle })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-3">
          <FormInput control={control} name="name" label={t('property.contactName')} required />
          <FormInput control={control} name="phone" label={t('property.contactPhone')} required />
          <FormTextarea
            control={control}
            name="message"
            label={t('property.contactMessage')}
            rows={4}
            placeholder={t('property.contactMessagePlaceholder')}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('property.sending') : t('property.contactSubmit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
