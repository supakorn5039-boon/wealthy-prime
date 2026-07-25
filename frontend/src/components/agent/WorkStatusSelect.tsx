import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { AgentService } from '@/services/AgentService'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { WORK_STATUS_OPTIONS, WORK_STATUS_LABEL_KEYS } from '@/constants/WorkStatus'
import type { AppointmentWorkStatus, Booking } from '@/types/Booking'

export function WorkStatusSelect({ contact, className }: { contact: Booking; className?: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<AppointmentWorkStatus | null>(null)

  const mutation = useMutation({
    mutationFn: (ws: AppointmentWorkStatus) => AgentService.updateWorkStatus(contact.id, ws),
    onSuccess: () => {
      toast.success(t('agent.workStatusSaved'))
      queryClient.invalidateQueries({ queryKey: [AgentService.QUERY_KEYS.CONTACTS] })
    },
    onError: (err: Error) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error(t('agent.workStatusBlocked'))
        return
      }
      toast.error(t('common.error'))
    },
    onSettled: () => setPending(null),
  })

  const propertyUnavailable =
    contact.propertyStatus === 'reserved' ||
    contact.propertyStatus === 'unavailable' ||
    contact.propertyStatus === 'sold'
  const isBlockedTransition = (ws: AppointmentWorkStatus) =>
    propertyUnavailable && (ws === 'booked' || ws === 'closed_deal')

  const pendingLabel = pending ? t(WORK_STATUS_LABEL_KEYS[pending]) : ''

  return (
    <>
      <Select
        value={contact.workStatus ?? ''}
        onValueChange={(v) => {
          const next = v as AppointmentWorkStatus
          if (next === contact.workStatus) return
          if (isBlockedTransition(next)) {
            toast.error(t('agent.workStatusBlocked'))
            return
          }
          setPending(next)
        }}
        disabled={mutation.isPending}
      >
        <SelectTrigger className={className ?? 'w-44 h-9 text-sm'}>
          <SelectValue placeholder={t('agent.workStatusPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {WORK_STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-sm">
              {t(opt.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('agent.workStatusConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('agent.workStatusConfirmDesc', { status: pendingLabel })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => pending && mutation.mutate(pending)}>
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
