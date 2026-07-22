import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom'
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
import { FormPasswordInput } from '@/components/form/FormPasswordInput'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { AuthService } from '@/services/AuthService'
import { useAuthStore } from '@/store/authStore'
import { loginSchema, type LoginSchema } from '@/dto/AuthValidation'
import { ROUTES } from '@/constants/Routes'

export default function LoginIndex() {
  const { t } = useTranslation()
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isAgent = searchParams.get('role') === 'agent'
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.HOME

  const { control, handleSubmit } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: AuthService.login,
    onSuccess: (data) => {
      login(data.token, data.user)
      toast.success(t('auth.welcomeUser', { name: data.user.name }))
      navigate(from, { replace: true })
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        toast.error(t('auth.loginPendingApproval'))
        return
      }
      toast.error(t('auth.loginError'))
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
          <CardTitle className="text-center">{t('auth.loginTitle')}</CardTitle>
          <CardDescription className="text-center">{t('auth.loginSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((values) => mutation.mutate(values), scrollToFirstError)} className="space-y-4">
            <FormInput control={control} name="email" label={t('auth.email')} type="email" placeholder={t('auth.emailPlaceholder')} required />
            <FormPasswordInput control={control} name="password" label={t('auth.password')} placeholder={t('auth.passwordPlaceholder')} autoComplete="current-password" required />
            <Link to={ROUTES.FORGOT_PASSWORD} className="block -mt-2 text-right text-sm text-primary hover:underline">
              {t('auth.forgotPasswordLink')}
            </Link>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? t('auth.loggingIn') : t('auth.loginButton')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link to={isAgent ? ROUTES.REGISTER_AGENT : ROUTES.REGISTER} className="text-primary hover:underline font-medium">
              {t('auth.registerLink')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
