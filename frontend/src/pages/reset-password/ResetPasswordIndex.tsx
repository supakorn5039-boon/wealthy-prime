import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormInput } from '@/components/form/FormInput'
import { AuthService } from '@/services/AuthService'
import { resetPasswordSchema, type ResetPasswordSchema } from '@/dto/AuthValidation'
import { ROUTES } from '@/constants/Routes'

export default function ResetPasswordIndex() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const { control, handleSubmit } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordSchema) => AuthService.resetPassword(token, values.newPassword),
    onSuccess: () => {
      toast.success(t('auth.resetPasswordSuccess'))
      navigate(ROUTES.LOGIN, { replace: true })
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        toast.error(t('auth.resetPasswordInvalid'))
        return
      }
      toast.error(t('auth.resetPasswordError'))
    },
  })

  return (
    <div className="w-full max-w-md px-4">
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <span className="text-2xl font-bold tracking-luxury text-primary">WEALTHY PRIME ESTATE</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">{t('auth.resetPasswordTitle')}</CardTitle>
          <CardDescription className="text-center">
            {token ? t('auth.resetPasswordSubtitle') : t('auth.resetPasswordInvalid')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <p className="text-center text-sm">
              <Link to={ROUTES.FORGOT_PASSWORD} className="text-primary hover:underline font-medium">
                {t('auth.forgotPasswordLink')}
              </Link>
            </p>
          ) : (
            <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
              <FormInput
                control={control}
                name="newPassword"
                label={t('auth.newPassword')}
                type="password"
                placeholder={t('auth.newPasswordPlaceholder')}
                required
              />
              <FormInput
                control={control}
                name="confirmPassword"
                label={t('auth.confirmPassword')}
                type="password"
                placeholder={t('auth.confirmPasswordPlaceholder')}
                required
              />
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? t('auth.resetPasswordSubmitting') : t('auth.resetPasswordButton')}
              </Button>
            </form>
          )}

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
