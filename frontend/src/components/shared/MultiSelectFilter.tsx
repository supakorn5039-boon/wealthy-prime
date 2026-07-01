import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export interface MultiSelectOption<T extends string | number> {
  value: T
  label: string
}

interface MultiSelectFilterProps<T extends string | number> {
  placeholder: string
  selectedLabel?: string
  selected: T[]
  options: MultiSelectOption<T>[]
  onChange: (next: T[]) => void
  searchPlaceholder?: string
  minWidth?: number
  align?: 'left' | 'right'
  className?: string
  disabled?: boolean
}

export function MultiSelectFilter<T extends string | number>({
  placeholder,
  selectedLabel,
  selected,
  options,
  onChange,
  searchPlaceholder,
  minWidth = 220,
  align = 'left',
  className,
  disabled,
}: MultiSelectFilterProps<T>) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const w = Math.max(rect.width, minWidth)
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: align === 'right' ? rect.right + window.scrollX - w : rect.left + window.scrollX,
      width: w,
    })
  }, [open, align, minWidth])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  const triggerText = (() => {
    if (selected.length === 0) return placeholder
    if (selected.length === 1) {
      return options.find((o) => o.value === selected[0])?.label ?? placeholder
    }
    return selectedLabel ?? t('common.itemsSelected', { count: selected.length })
  })()

  const toggle = (value: T) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  const clear = () => onChange([])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed',
          selected.length === 0 && 'text-muted-foreground',
          className,
        )}
      >
        <span className="truncate text-left">{triggerText}</span>
        <span className="flex items-center gap-1 shrink-0 ml-2">
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              aria-label="clear"
              onClick={(e) => {
                e.stopPropagation()
                clear()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation()
                  clear()
                }
              }}
              className="rounded hover:bg-muted p-0.5 cursor-pointer"
            >
              <X className="size-3.5 opacity-60" />
            </span>
          )}
          <ChevronDown className="size-4 opacity-50" />
        </span>
      </button>
      {open && position && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 1000,
          }}
          className="max-h-96 overflow-hidden rounded-md border border-border bg-popover shadow-lg flex flex-col"
        >
          <div className="p-2 border-b border-border/60">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder ?? t('common.search')}
                className="h-8 w-full rounded border border-input bg-background pl-7 pr-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">{t('common.noResults')}</p>
            ) : (
              filtered.map((opt) => {
                const checked = selected.includes(opt.value)
                return (
                  <button
                    type="button"
                    key={String(opt.value)}
                    onClick={() => toggle(opt.value)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted text-sm text-left"
                  >
                    <span
                      className={cn(
                        'size-4 rounded border flex items-center justify-center shrink-0',
                        checked ? 'bg-primary border-primary' : 'border-input',
                      )}
                    >
                      {checked && <Check className="size-3 text-primary-foreground" />}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
