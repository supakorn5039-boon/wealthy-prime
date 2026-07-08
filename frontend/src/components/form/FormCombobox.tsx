import { useMemo } from 'react'
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { PopoverMenu } from '@/components/form/PopoverMenu'
import { usePopover } from '@/hooks/usePopover'
import { cn } from '@/lib/utils'

interface ComboboxOption {
  value: string
  label: string
}

interface FormComboboxProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  options: ComboboxOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export function FormCombobox<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  required,
  disabled,
}: FormComboboxProps<T>) {
  const { t } = useTranslation()
  const { field, fieldState } = useController({ control, name })
  const { open, setOpen, query, setQuery, triggerRef, menuRef, position } = usePopover()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  const selectedLabel = options.find((o) => o.value === field.value)?.label ?? ''

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
          !selectedLabel && 'text-muted-foreground',
          fieldState.error && 'border-red-500',
          disabled && 'opacity-50 cursor-not-allowed bg-muted',
        )}
      >
        <span className="truncate text-left">{selectedLabel || placeholder || t('common.search')}</span>
        <ChevronDown className="size-4 opacity-50 shrink-0 ml-2" />
      </button>
      {open && !disabled && (
        <PopoverMenu menuRef={menuRef} position={position} query={query} onQueryChange={setQuery}>
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{t('common.noResults')}</p>
          ) : (
            filtered.map((opt) => {
              const active = opt.value === field.value
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    field.onChange(opt.value)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted text-sm text-left"
                >
                  <Check className={cn('size-3.5 shrink-0', active ? 'text-primary' : 'opacity-0')} />
                  <span className="truncate">{opt.label}</span>
                </button>
              )
            })
          )}
        </PopoverMenu>
      )}
      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
    </div>
  )
}
