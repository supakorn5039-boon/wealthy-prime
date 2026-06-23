import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { daysSince } from '@/utils/date'
import type { Booking } from '@/types/Booking'

export function MissedContactBadge({ booking }: { booking: Booking }) {
  const { t } = useTranslation()
  const days = daysSince(booking.appointmentDate)

  const isMissed =
    days > 0 &&
    !booking.workStatus &&
    booking.status !== 'completed' &&
    booking.status !== 'cancelled'

  if (!isMissed) return null

  return (
    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300">
      <AlertTriangle className="size-3 mr-1" />
      {t('admin.missedContactDays', { count: days })}
    </Badge>
  )
}
