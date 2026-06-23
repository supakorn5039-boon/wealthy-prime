import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search } from 'lucide-react'
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  usePhoneInput,
  FlagImage,
  defaultCountries,
  parseCountry,
  type ParsedCountry,
} from 'react-international-phone'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const PARSED_COUNTRIES: ParsedCountry[] = defaultCountries.map((c) => parseCountry(c))

interface FormPhoneInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  required?: boolean
}

// Phone input built on react-international-phone's usePhoneInput hook for
// E.164 + per-country formatting, plus a custom searchable country dropdown
// (the bundled <PhoneInput> has no search in v4.8). Styling matches the rest
// of the shadcn-style form inputs (same height, bg-input, border, no hover).
export function FormPhoneInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
}: FormPhoneInputProps<T>) {
  const { t } = useTranslation()
  const { field, fieldState } = useController({ control, name })

  const { inputValue, country, setCountry, handlePhoneValueChange, inputRef } = usePhoneInput({
    defaultCountry: 'th',
    value: (field.value as string | undefined) ?? '',
    countries: defaultCountries,
    onChange: ({ phone }) => field.onChange(phone),
  })

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const w = Math.max(rect.width + 240, 320)
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: w,
    })
  }, [open])

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
    if (!q) return PARSED_COUNTRIES
    return PARSED_COUNTRIES.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.iso2.toLowerCase().includes(q) ||
        c.dialCode.includes(q.replace(/^\+/, ''))
      )
    })
  }, [query])

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <div
        className={cn(
          'flex h-10 w-full rounded-md border border-border bg-input overflow-hidden',
          fieldState.error && 'border-red-500',
        )}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 border-r border-border bg-input text-foreground shrink-0"
        >
          <FlagImage iso2={country.iso2} size="20px" />
          <ChevronDown className="size-3.5 opacity-60" />
        </button>
        <input
          ref={inputRef}
          type="tel"
          value={inputValue}
          onChange={handlePhoneValueChange}
          onBlur={field.onBlur}
          name={field.name}
          placeholder={placeholder}
          className="flex-1 bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>
      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}

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
          className="max-h-80 overflow-hidden rounded-md border border-border bg-popover shadow-lg flex flex-col"
        >
          <div className="p-2 border-b border-border/60">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('common.searchCountry')}
                className="h-8 w-full rounded border border-input bg-background pl-7 pr-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">{t('common.noCountriesFound')}</p>
            ) : (
              filtered.map((c) => (
                <button
                  type="button"
                  key={c.iso2}
                  onClick={() => {
                    setCountry(c.iso2)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-left text-popover-foreground',
                    c.iso2 === country.iso2 ? 'bg-accent/40' : '',
                  )}
                >
                  <FlagImage iso2={c.iso2} size="20px" />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-muted-foreground text-xs">+{c.dialCode}</span>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
