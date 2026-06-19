import type { AppointmentWorkStatus } from '@/types/Booking'

export const WORK_STATUS_LABEL_KEYS: Record<Exclude<AppointmentWorkStatus, ''>, string> = {
  contacted: 'workStatus.contacted',
  visited: 'workStatus.visited',
  booked: 'workStatus.booked',
  closed_deal: 'workStatus.closed_deal',
  customer_cancelled: 'workStatus.customer_cancelled',
}

export const WORK_STATUS_OPTIONS = (Object.keys(WORK_STATUS_LABEL_KEYS) as Exclude<AppointmentWorkStatus, ''>[]).map(
  (value) => ({ value, labelKey: WORK_STATUS_LABEL_KEYS[value] }),
)
