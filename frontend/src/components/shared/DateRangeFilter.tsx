import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DateRangeValue {
  from: string
  to: string
}

export const EMPTY_DATE_RANGE: DateRangeValue = { from: '', to: '' }

interface DateRangeFilterProps {
  value: DateRangeValue
  onChange: (next: DateRangeValue) => void
  className?: string
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const { t } = useTranslation()
  const hasValue = Boolean(value.from || value.to)

  const inputClass =
    'h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <input
        type="date"
        aria-label={t('filters.dateFrom')}
        value={value.from}
        max={value.to || undefined}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
        className={inputClass}
      />
      <span className="text-muted-foreground text-sm shrink-0">–</span>
      <input
        type="date"
        aria-label={t('filters.dateTo')}
        value={value.to}
        min={value.from || undefined}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
        className={inputClass}
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_DATE_RANGE)}
          aria-label={t('filters.clearDate')}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

export function matchesDateRange(iso: string | undefined, range: DateRangeValue): boolean {
  if (!range.from && !range.to) return true
  if (!iso) return false
  const day = localDayKey(iso)
  if (!day) return false
  const from = range.from || range.to
  const to = range.to || range.from
  return day >= from && day <= to
}

function localDayKey(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${date}`
}
