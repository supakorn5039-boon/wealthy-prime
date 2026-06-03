import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormPriceInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

// Numeric input that renders the current value with thousands separators
// (e.g. "1,000,000") while storing it in the form state as a plain digit
// string ("1000000"). Validation that calls Number(value) continues to work.
export function FormPriceInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  disabled,
}: FormPriceInputProps<T>) {
  const { field, fieldState } = useController({ control, name })

  const raw = String(field.value ?? '').replace(/[^\d]/g, '')
  const display = raw ? Number(raw).toLocaleString('en-US') : ''

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        disabled={disabled}
        value={display}
        onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, ''))}
        onBlur={field.onBlur}
        name={field.name}
        ref={field.ref}
        className={cn(fieldState.error && 'border-red-500', disabled && 'bg-gray-100')}
      />
      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
    </div>
  )
}
