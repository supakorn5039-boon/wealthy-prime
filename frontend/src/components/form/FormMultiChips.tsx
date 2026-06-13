import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface ChipOption {
  value: string
  label: string
}

interface FormMultiChipsProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  options: readonly ChipOption[]
  required?: boolean
}

// FormMultiChips renders a list of toggleable chip-buttons backed by a CSV
// string field. The field stores CSV of `value`s ("12, 34"); chips display
// `label`. Persisted with ", " separator to match the BTS/MRT requirement.
export function FormMultiChips<T extends FieldValues>({
  control,
  name,
  label,
  options,
  required,
}: FormMultiChipsProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const value = String(field.value ?? '')
  const selected = new Set(
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )

  const toggle = (val: string) => {
    if (selected.has(val)) selected.delete(val)
    else selected.add(val)
    field.onChange(Array.from(selected).join(', '))
  }

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-2 border rounded-md bg-muted/40/50">
        {options.map((opt) => {
          const active = selected.has(opt.value)
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={cn(
                'text-xs px-2 py-1 rounded-full border transition-colors',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:border-primary',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {selected.size > 0 && (
        <p className="text-xs text-muted-foreground">{selected.size} selected</p>
      )}
      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
    </div>
  )
}
