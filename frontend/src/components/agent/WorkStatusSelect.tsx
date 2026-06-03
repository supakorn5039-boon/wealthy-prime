import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { AgentService } from '@/services/AgentService'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AppointmentWorkStatus, Booking } from '@/types/Booking'

const OPTIONS: { value: AppointmentWorkStatus; labelKey: string }[] = [
  { value: 'contacted', labelKey: 'workStatus.contacted' },
  { value: 'visited', labelKey: 'workStatus.visited' },
  { value: 'booked', labelKey: 'workStatus.booked' },
  { value: 'closed_deal', labelKey: 'workStatus.closed_deal' },
  { value: 'customer_cancelled', labelKey: 'workStatus.customer_cancelled' },
]

export function WorkStatusSelect({ contact, className }: { contact: Booking; className?: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (ws: AppointmentWorkStatus) => AgentService.updateWorkStatus(contact.id, ws),
    onSuccess: () => {
      toast.success(t('agent.workStatusSaved'))
      queryClient.invalidateQueries({ queryKey: [AgentService.QUERY_KEYS.CONTACTS] })
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <Select
      value={contact.workStatus ?? ''}
      onValueChange={(v) => mutation.mutate(v as AppointmentWorkStatus)}
      disabled={mutation.isPending}
    >
      <SelectTrigger className={className ?? 'w-44 h-9 text-sm'}>
        <SelectValue placeholder={t('agent.workStatusPlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-sm">
            {t(opt.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
