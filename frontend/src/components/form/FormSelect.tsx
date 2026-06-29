import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface FormSelectProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  required,
  disabled,
}: FormSelectProps<T>) {
  const { t } = useTranslation()
  const { field, fieldState } = useController({ control, name })

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
        <SelectTrigger
          aria-invalid={!!fieldState.error}
          className={cn(fieldState.error && 'border-red-500')}
        >
          <SelectValue placeholder={placeholder ?? t('common.search')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
    </div>
  )
}
