import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormTextareaProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  className?: string
  resizable?: boolean
}

export function FormTextarea<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  disabled,
  rows = 3,
  className,
  resizable = true,
}: FormTextareaProps<T>) {
  const { field, fieldState } = useController({ control, name })

  return (
    <div className="space-y-1.5">
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}
      <textarea
        {...field}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        value={field.value ?? ''}
        aria-invalid={!!fieldState.error}
        className={cn(
          'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2',
          resizable ? 'resize-y min-h-[80px]' : 'resize-none',
          fieldState.error && 'border-red-500',
          disabled && 'bg-muted opacity-100',
          className,
        )}
      />
      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
    </div>
  )
}
