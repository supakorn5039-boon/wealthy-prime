import { useState } from 'react'
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormPasswordInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  autoComplete?: string
}

export function FormPasswordInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  disabled,
  autoComplete,
}: FormPasswordInputProps<T>) {
  const { t } = useTranslation()
  const { field, fieldState } = useController({ control, name })
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <div className="relative">
        <Input
          {...field}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          disabled={disabled}
          value={field.value ?? ''}
          autoComplete={autoComplete}
          aria-invalid={!!fieldState.error}
          className={cn('pr-10', fieldState.error && 'border-red-500', disabled && 'bg-muted')}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={t(visible ? 'auth.hidePassword' : 'auth.showPassword')}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
    </div>
  )
}
