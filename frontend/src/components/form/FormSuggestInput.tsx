import { useRef, useState } from 'react'
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

interface FormSuggestInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  queryKey: string
  fetchSuggestions: (q: string) => Promise<string[]>
  placeholder?: string
  required?: boolean
  suggestionsTitle?: string
}

export function FormSuggestInput<T extends FieldValues>({
  control,
  name,
  label,
  queryKey,
  fetchSuggestions,
  placeholder,
  required,
  suggestionsTitle,
}: FormSuggestInputProps<T>) {
  const { t } = useTranslation()
  const { field, fieldState } = useController({ control, name })
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const text = String(field.value ?? '')
  const debounced = useDebounce(text.trim(), 300)

  useClickOutside(wrapRef, () => setOpen(false), open)

  const { data: suggestions = [] } = useQuery({
    queryKey: [queryKey, debounced],
    queryFn: () => fetchSuggestions(debounced),
    enabled: open && debounced.length >= 2,
    staleTime: 30_000,
  })

  const visible =
    open &&
    debounced.length >= 2 &&
    suggestions.length > 0 &&
    !(suggestions.length === 1 && suggestions[0] === text)

  return (
    <div className="space-y-1.5" ref={wrapRef}>
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <div className="relative">
        <Input
          {...field}
          value={text}
          autoComplete="off"
          placeholder={placeholder}
          aria-invalid={!!fieldState.error}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            field.onChange(e.target.value)
            setOpen(true)
          }}
          className={cn(fieldState.error && 'border-red-500')}
        />
        {visible && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
            <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/60">
              {suggestionsTitle ?? t('common.search')}
            </p>
            {suggestions.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => {
                  field.onChange(s)
                  setOpen(false)
                }}
                className="block w-full px-3 py-2 text-sm text-left hover:bg-muted truncate"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
    </div>
  )
}
