import { useState } from 'react'
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
import { FormPasswordInput } from '@/components/form/FormPasswordInput'
import { FormPhoneInput } from '@/components/form/FormPhoneInput'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { AuthService } from '@/services/AuthService'
import { registerSchema, type RegisterSchema } from '@/dto/AuthValidation'
import { ROUTES } from '@/constants/Routes'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/Auth'

type AgentRole = 'agent' | 'general_agent'

const AGENT_ROLES: AgentRole[] = ['agent', 'general_agent']

interface RegisterIndexProps {
  role?: 'user' | 'agent'
}

export default function RegisterIndex({ role = 'user' }: RegisterIndexProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from
  const isAgent = role === 'agent'
  const [agentRole, setAgentRole] = useState<AgentRole>('agent')
  const submitRole: UserRole = isAgent ? agentRole : role

  const { control, handleSubmit, setValue } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
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
    mutationFn: ({ confirmPassword: _confirmPassword, ...payload }: RegisterSchema) => AuthService.register(payload),
    onSuccess: (_, vars) => {
      const msgKey = vars.role === 'user' ? 'auth.registerSuccess' : 'auth.registerPendingApproval'
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
            {isAgent ? t(`auth.registerRoleTitle.${agentRole}`) : t('auth.registerTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            {isAgent ? t(`auth.registerRoleSubtitle.${agentRole}`) : t('auth.registerSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAgent && (
            <div className="mb-4 space-y-1.5">
              <p className="text-sm font-medium">{t('auth.registerRoleLabel')}</p>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-input p-1">
                {AGENT_ROLES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setAgentRole(value)
                      setValue('role', value)
                    }}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      agentRole === value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {t(`role.${value}`)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{t(`auth.registerRoleHint.${agentRole}`)}</p>
            </div>
          )}

          <form onSubmit={handleSubmit((values) => mutation.mutate({ ...values, role: submitRole }), scrollToFirstError)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput control={control} name="firstName" label={t('auth.firstName')} placeholder={t('auth.firstNamePlaceholder')} required />
              <FormInput control={control} name="lastName" label={t('auth.lastName')} placeholder={t('auth.lastNamePlaceholder')} required />
            </div>
            <FormInput control={control} name="email" label={t('auth.email')} type="email" placeholder={t('auth.emailPlaceholder')} required />
            <div className="grid grid-cols-1 gap-3">
              <FormPasswordInput control={control} name="password" label={t('auth.password')} placeholder={t('auth.passwordPlaceholder')} autoComplete="new-password" required />
              <FormPasswordInput control={control} name="confirmPassword" label={t('auth.confirmPassword')} placeholder={t('auth.confirmPasswordPlaceholder')} autoComplete="new-password" required />
            </div>
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
