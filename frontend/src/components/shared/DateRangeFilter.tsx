import { useState } from 'react'
import { CalendarDays, ChevronDown, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type DateRangeValue = DateRange | undefined

export const EMPTY_DATE_RANGE: DateRangeValue = undefined

const LOCALE_MAP: Record<string, string> = {
  th: 'th-TH',
  en: 'en-US',
  zh: 'zh-CN',
}

interface DateRangeFilterProps {
  value: DateRangeValue
  onChange: (next: DateRangeValue) => void
  placeholder?: string
  className?: string
  numberOfMonths?: number
}

export function DateRangeFilter({ value, onChange, placeholder, className, numberOfMonths = 2 }: DateRangeFilterProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [tempRange, setTempRange] = useState<DateRange | undefined>(value)

  const hasValue = Boolean(value?.from)

  const handleOpenChange = (next: boolean) => {
    if (next) setTempRange(value)
    setOpen(next)
  }

  const formatDay = (date: Date) =>
    date.toLocaleDateString(LOCALE_MAP[i18n.language] ?? 'th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const label = (() => {
    if (!value?.from) return placeholder ?? t('filters.date')
    if (value.to) return `${formatDay(value.from)} – ${formatDay(value.to)}`
    return `${formatDay(value.from)} –`
  })()

  const handleSelect = (range: DateRange | undefined) => {
    setTempRange(range)
    if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) {
      onChange(range)
      setOpen(false)
    }
  }

  const handleClear = () => {
    setTempRange(undefined)
    onChange(undefined)
    setOpen(false)
  }

  const handleConfirm = () => {
    onChange(tempRange)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted/40',
            !hasValue && 'text-muted-foreground',
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate text-left">
            <CalendarDays className="size-4 shrink-0 opacity-60" />
            <span className="truncate">{label}</span>
          </span>
          <span className="ml-2 flex shrink-0 items-center gap-1">
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                aria-label={t('filters.clearDate')}
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleClear()
                }}
                className="cursor-pointer rounded p-0.5 hover:bg-muted"
              >
                <X className="size-3.5 opacity-60" />
              </span>
            )}
            <ChevronDown className="size-4 opacity-50" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Calendar
          mode="range"
          selected={tempRange}
          onSelect={handleSelect}
          numberOfMonths={numberOfMonths}
          defaultMonth={tempRange?.from}
          autoFocus
        />
        <div className="flex justify-end gap-2 border-t border-border p-2">
          {tempRange?.from && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              {t('filters.clearDate')}
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
          >
            {t('common.confirm')}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function matchesDateRange(iso: string | undefined, range: DateRangeValue): boolean {
  if (!range?.from && !range?.to) return true
  if (!iso) return false
  const day = dayStart(new Date(iso))
  if (day === null) return false
  const from = range?.from ? dayStart(range.from) : null
  const to = range?.to ? dayStart(range.to) : from
  if (from !== null && day < from) return false
  if (to !== null && day > to) return false
  return true
}

function dayStart(d: Date): number | null {
  if (Number.isNaN(d.getTime())) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}
