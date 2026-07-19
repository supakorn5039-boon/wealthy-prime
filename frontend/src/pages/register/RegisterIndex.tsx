import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormInput } from '@/components/form/FormInput'
import { FormPhoneInput } from '@/components/form/FormPhoneInput'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { AuthService } from '@/services/AuthService'
import { registerSchema, type RegisterSchema } from '@/dto/AuthValidation'
import { ROUTES } from '@/constants/Routes'

interface RegisterIndexProps {
  role?: 'user' | 'agent'
}

export default function RegisterIndex({ role = 'user' }: RegisterIndexProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from
  const isAgent = role === 'agent'

  const { control, handleSubmit } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      secondaryPhone: '',
      lineId: '',
      facebook: '',
      wechat: '',
      whatsapp: '',
      role,
    },
  })

  const mutation = useMutation({
    mutationFn: AuthService.register,
    onSuccess: (_, vars) => {
      const msgKey = vars.role === 'agent' ? 'auth.registerPendingApproval' : 'auth.registerSuccess'
      toast.success(t(msgKey))
      navigate(isAgent ? ROUTES.LOGIN_AGENT : ROUTES.LOGIN, { replace: true, state: from ? { from } : undefined })
    },
    onError: () => toast.error(t('auth.registerError')),
  })

  return (
    <div className="w-full max-w-xl px-4 py-8">
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-3">
          <Logo size={56} />
          <span className="text-2xl font-bold tracking-luxury text-primary">WEALTHY PRIME ESTATE</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {isAgent ? t('auth.registerAgentTitle') : t('auth.registerTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            {isAgent ? t('auth.registerAgentSubtitle') : t('auth.registerSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((values) => mutation.mutate(values), scrollToFirstError)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput control={control} name="firstName" label={t('auth.firstName')} placeholder={t('auth.firstNamePlaceholder')} required />
              <FormInput control={control} name="lastName" label={t('auth.lastName')} placeholder={t('auth.lastNamePlaceholder')} required />
            </div>
            <FormInput control={control} name="email" label={t('auth.email')} type="email" placeholder={t('auth.emailPlaceholder')} required />
            <FormInput control={control} name="password" label={t('auth.password')} type="password" placeholder={t('auth.passwordPlaceholder')} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormPhoneInput control={control} name="phone" label={t('auth.phone')} required />
              <FormPhoneInput control={control} name="secondaryPhone" label={t('auth.secondaryPhone')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput control={control} name="lineId" label={t('auth.lineId')} placeholder={t('auth.lineId')} />
              <FormInput control={control} name="facebook" label={t('auth.facebook')} placeholder={t('auth.facebook')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput control={control} name="wechat" label={t('auth.wechat')} placeholder={t('auth.wechat')} />
              <FormInput control={control} name="whatsapp" label={t('auth.whatsapp')} placeholder={t('auth.whatsapp')} />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? t('auth.registering') : t('auth.registerButton')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to={isAgent ? ROUTES.LOGIN_AGENT : ROUTES.LOGIN} className="text-primary hover:underline font-medium">
              {t('auth.loginLink')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
