import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  type?: string
  min?: number | string
  max?: number | string
  step?: number | string
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  disabled,
  type = 'text',
  min,
  max,
  step,
}: FormInputProps<T>) {
  const { field, fieldState } = useController({ control, name })

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Input
        {...field}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        value={field.value ?? ''}
        min={min}
        max={max}
        step={step}
        onKeyDown={(e) => {
          if (type === 'number' && (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+')) {
            e.preventDefault()
          }
        }}
        className={cn(fieldState.error && 'border-red-500', disabled && 'bg-muted')}
      />
      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
    </div>
  )
}
