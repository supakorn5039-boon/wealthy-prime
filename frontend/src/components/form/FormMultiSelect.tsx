import { useMemo } from 'react'
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { PopoverMenu } from '@/components/form/PopoverMenu'
import { usePopover } from '@/hooks/usePopover'
import { cn } from '@/lib/utils'

interface MultiSelectOption {
  value: string
  label: string
}

interface FormMultiSelectProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  options: readonly MultiSelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export function FormMultiSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  required,
  disabled,
}: FormMultiSelectProps<T>) {
  const { t } = useTranslation()
  const { field, fieldState } = useController({ control, name })
  const { open, setOpen, query, setQuery, triggerRef, menuRef, position } = usePopover(240)

  const selected = useMemo(
    () =>
      String(field.value ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [field.value],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  const labelOf = (value: string) => options.find((o) => o.value === value)?.label ?? value

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    field.onChange(next.join(', '))
  }

  const triggerText =
    selected.length === 0
      ? placeholder ?? t('common.search')
      : selected.length === 1
        ? labelOf(selected[0])
        : t('common.itemsSelected', { count: selected.length })

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-invalid={!!fieldState.error}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm hover:bg-muted/40',
          selected.length === 0 && 'text-muted-foreground',
          fieldState.error && 'border-red-500',
          disabled && 'opacity-50 cursor-not-allowed bg-muted',
        )}
      >
        <span className="truncate text-left">{triggerText}</span>
        <ChevronDown className="size-4 opacity-50 shrink-0 ml-2" />
      </button>
      {open && !disabled && (
        <PopoverMenu
          menuRef={menuRef}
          position={position}
          query={query}
          onQueryChange={setQuery}
          container={triggerRef.current?.closest<HTMLElement>('[role="dialog"]') || document.body}
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{t('common.noResults')}</p>
          ) : (
            filtered.map((opt) => {
              const checked = selected.includes(opt.value)
              return (
                <button
                  type="button"
                  key={opt.value}
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
        </PopoverMenu>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border bg-primary/10 border-primary/30 text-foreground"
            >
              {labelOf(value)}
              <button
                type="button"
                onClick={() => toggle(value)}
                className="rounded-full hover:bg-primary/20"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
    </div>
  )
}
