import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormInput } from '@/components/form/FormInput'
import { FormSelect } from '@/components/form/FormSelect'
import { AuthService } from '@/services/AuthService'
import { useAuthStore } from '@/store/authStore'
import { registerSchema, type RegisterSchema } from '@/dto/AuthValidation'
import { ROUTES } from '@/constants/Routes'

export default function RegisterIndex() {
  const { t } = useTranslation()
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const roleOptions = [
    { value: 'user', label: t('auth.roleUser') },
    { value: 'agent', label: t('auth.roleAgent') },
  ]

  const { control, handleSubmit } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', phone: '', role: 'user' },
  })

  const mutation = useMutation({
    mutationFn: AuthService.register,
    onSuccess: (data) => {
      login(data.token, data.user)
      toast.success(t('auth.registerSuccess'))
      navigate(ROUTES.HOME)
    },
    onError: () => toast.error(t('auth.registerError')),
  })

  return (
    <div className="w-full max-w-md px-4 py-8">
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Crown className="h-8 w-8 text-amber-500" />
          <span className="text-2xl font-bold">Wealthy Prime Estate</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">{t('auth.registerTitle')}</CardTitle>
          <CardDescription className="text-center">{t('auth.registerSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
            <FormInput control={control} name="name" label={t('auth.name')} placeholder={t('auth.namePlaceholder')} required />
            <FormInput control={control} name="email" label={t('auth.email')} type="email" placeholder={t('auth.emailPlaceholder')} required />
            <FormInput control={control} name="password" label={t('auth.password')} type="password" placeholder={t('auth.passwordPlaceholder')} required />
            <FormInput control={control} name="phone" label={t('auth.phone')} placeholder={t('auth.phonePlaceholder')} required />
            <FormSelect control={control} name="role" label={t('auth.roleLabel')} options={roleOptions} required />
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? t('auth.registering') : t('auth.registerButton')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
              {t('auth.loginLink')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
