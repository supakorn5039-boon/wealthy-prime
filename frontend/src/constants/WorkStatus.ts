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

export const WORK_STATUS_NOT_SET = 'not_set'

export type WorkStatusFilterValue = Exclude<AppointmentWorkStatus, ''> | typeof WORK_STATUS_NOT_SET

export const WORK_STATUS_FILTER_OPTIONS: { value: WorkStatusFilterValue; labelKey: string }[] = [
  { value: WORK_STATUS_NOT_SET, labelKey: 'workStatus.notSet' },
  ...WORK_STATUS_OPTIONS,
]

export function workStatusFilterValue(workStatus: AppointmentWorkStatus | undefined): WorkStatusFilterValue {
  return workStatus ? workStatus : WORK_STATUS_NOT_SET
}

export const ADMIN_WORK_STATUS_FILTER_OPTIONS: { value: WorkStatusFilterValue; labelKey: string }[] =
  WORK_STATUS_OPTIONS
