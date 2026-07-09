import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
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
import { getExampleNumber, type CountryCode } from 'libphonenumber-js'
import examples from 'libphonenumber-js/examples.mobile.json'
import { Label } from '@/components/ui/label'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/lib/utils'

const PARSED_COUNTRIES: ParsedCountry[] = defaultCountries.map((c) => parseCountry(c))

const NATIONAL_LENGTH_CACHE = new Map<string, number>()
function getNationalLength(iso2: string): number {
  const key = iso2.toLowerCase()
  const cached = NATIONAL_LENGTH_CACHE.get(key)
  if (cached !== undefined) return cached
  let length = 15
  try {
    const example = getExampleNumber(iso2.toUpperCase() as CountryCode, examples)
    if (example) length = example.nationalNumber.length
  } catch {

  }
  NATIONAL_LENGTH_CACHE.set(key, length)
  return length
}

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  name?: string
  placeholder?: string
  error?: boolean
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  name,
  placeholder,
  error,
}: PhoneInputProps) {
  const { t } = useTranslation()

  const { inputValue, country, setCountry, handlePhoneValueChange, inputRef } = usePhoneInput({
    defaultCountry: 'th',
    value: value ?? '',
    countries: defaultCountries,
    disableDialCodeAndPrefix: true,
    onChange: ({ phone }) => onChange(phone),
  })

  const maxDigits = useMemo(() => getNationalLength(country.iso2), [country.iso2])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^\d\s()\-]/g, '')
    const digitCount = sanitized.replace(/\D/g, '').length
    if (digitCount > maxDigits) return
    if (sanitized !== e.target.value) {
      e.target.value = sanitized
    }
    handlePhoneValueChange(e)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (!pasted) return
    const input = inputRef.current
    if (!input) return
    e.preventDefault()
    const cleaned = pasted.replace(/\D/g, '').replace(/^0+/, '')
    if (!cleaned) return
    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? input.value.length
    const nextValue = input.value.slice(0, start) + cleaned + input.value.slice(end)
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, nextValue)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const preferred = Math.max(rect.width + 240, 320)
    const maxAvailable = window.innerWidth - rect.left - 8
    const w = Math.min(preferred, Math.max(maxAvailable, 240))
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: w,
    })
  }, [open])

  useClickOutside([triggerRef, menuRef], () => setOpen(false), open)

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
    <>
      <div
        className={cn(
          'flex h-10 w-full rounded-md border border-border bg-input overflow-hidden',
          error && 'border-red-500',
        )}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 border-r border-border bg-input text-foreground shrink-0"
        >
          <FlagImage iso2={country.iso2} size="20px" />
          <span className="text-sm text-foreground">+{country.dialCode}</span>
          <ChevronDown className="size-3.5 opacity-60" />
        </button>
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={inputValue}
          onChange={handleChange}
          onPaste={handlePaste}
          onBlur={onBlur}
          name={name}
          placeholder={placeholder}
          aria-invalid={error}
          className="flex-1 min-w-0 bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      {open && position && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 1200,
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
    </>
  )
}

interface FormPhoneInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  required?: boolean
}

export function FormPhoneInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
}: FormPhoneInputProps<T>) {
  const { field, fieldState } = useController({ control, name })

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <PhoneInput
        value={(field.value as string | undefined) ?? ''}
        onChange={field.onChange}
        onBlur={field.onBlur}
        name={field.name}
        placeholder={placeholder}
        error={!!fieldState.error}
      />
      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
    </div>
  )
}
