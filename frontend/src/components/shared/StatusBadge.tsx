import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { PropertyStatus } from '@/types/Property'
import type { BookingStatus } from '@/types/Booking'

const propertyVariantMap: Record<PropertyStatus, 'success' | 'warning' | 'info' | 'destructive' | 'secondary'> = {
  available: 'success',
  pending_approve: 'warning',
  reserved: 'info',
  sold: 'destructive',
}

const bookingVariantMap: Record<BookingStatus, 'success' | 'warning' | 'info' | 'destructive' | 'secondary'> = {
  pending: 'warning',
  assigned: 'info',
  completed: 'success',
  cancelled: 'secondary',
}

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  const { t } = useTranslation()
  const variant = propertyVariantMap[status] ?? 'secondary'
  const label = t(`property.status.${status}`, { defaultValue: status })
  return <Badge variant={variant}>{label}</Badge>
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useTranslation()
  const variant = bookingVariantMap[status] ?? 'secondary'
  const label = t(`booking.${status}`, { defaultValue: status })
  return <Badge variant={variant}>{label}</Badge>
}
