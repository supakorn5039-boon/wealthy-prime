import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { WORK_STATUS_LABEL_KEYS } from '@/constants/WorkStatus'
import type { PropertyStatus } from '@/types/Property'
import type { BookingStatus, AppointmentWorkStatus } from '@/types/Booking'

const bookingVariantMap: Record<BookingStatus, 'success' | 'warning' | 'info' | 'destructive' | 'secondary'> = {
  pending: 'warning',
  assigned: 'info',
  completed: 'success',
  cancelled: 'secondary',
}

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  const { t } = useTranslation()
  const label = t(`property.status.${status}`, { defaultValue: status })
  return <Badge className="bg-black text-white border-white/20 hover:bg-black">{label}</Badge>
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useTranslation()
  const variant = bookingVariantMap[status] ?? 'secondary'
  const label = t(`booking.${status}`, { defaultValue: status })
  return <Badge variant={variant}>{label}</Badge>
}

export function WorkStatusBadge({ workStatus }: { workStatus?: AppointmentWorkStatus }) {
  const { t } = useTranslation()
  if (!workStatus) {
    return <Badge variant="outline" className="text-muted-foreground">{t('workStatus.notSet')}</Badge>
  }
  return <Badge variant="outline">{t(WORK_STATUS_LABEL_KEYS[workStatus])}</Badge>
}
