import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormInput } from '@/components/form/FormInput'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { AuthService } from '@/services/AuthService'
import { forgotPasswordSchema, type ForgotPasswordSchema } from '@/dto/AuthValidation'
import { ROUTES } from '@/constants/Routes'

export default function ForgotPasswordIndex() {
  const { t } = useTranslation()

  const { control, handleSubmit, reset } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordSchema) => AuthService.requestPasswordReset(values.email),
    onSuccess: () => {
      toast.success(t('auth.forgotPasswordSuccess'))
      reset({ email: '' })
    },
    onError: () => {
      toast.error(t('auth.forgotPasswordError'))
    },
  })

  return (
    <div className="w-full max-w-md px-4">
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-3">
          <Logo size={56} />
          <span className="text-2xl font-bold tracking-luxury text-primary">WEALTHY PRIME ESTATE</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">{t('auth.forgotPasswordTitle')}</CardTitle>
          <CardDescription className="text-center">{t('auth.forgotPasswordSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((values) => mutation.mutate(values), scrollToFirstError)} className="space-y-4">
            <FormInput
              control={control}
              name="email"
              label={t('auth.email')}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              required
            />
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? t('auth.forgotPasswordSending') : t('auth.forgotPasswordButton')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
              {t('auth.backToLogin')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
