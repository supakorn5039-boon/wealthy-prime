import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { AgentService } from '@/services/AgentService'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WORK_STATUS_OPTIONS } from '@/constants/WorkStatus'
import type { AppointmentWorkStatus, Booking } from '@/types/Booking'

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
        {WORK_STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-sm">
            {t(opt.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
