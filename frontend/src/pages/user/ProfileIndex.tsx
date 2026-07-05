import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { History, Heart, Phone as PhoneIcon, ChevronRight } from 'lucide-react'
import { AuthService } from '@/services/AuthService'
import { useAuthStore } from '@/store/authStore'
import { FormInput } from '@/components/form/FormInput'
import { FormPhoneInput } from '@/components/form/FormPhoneInput'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageTitle } from '@/components/shared/PageTitle'
import { PageContainer } from '@/components/shared/PageContainer'
import { profileSchema, type ProfileSchema } from '@/dto/AuthValidation'
import { formatDate } from '@/utils/date'
import { ROUTES } from '@/constants/Routes'

export default function ProfileIndex() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { user, login, token } = useAuthStore()

  const { data: profile } = useQuery({
    queryKey: [AuthService.QUERY_KEYS.PROFILE],
    queryFn: AuthService.getProfile,
    initialData: user ?? undefined,
  })

  const { control, handleSubmit, reset } = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      secondaryPhone: '',
      lineId: '',
      facebook: '',
      wechat: '',
      whatsapp: '',
    },
  })

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName ?? profile.name?.split(' ')[0] ?? '',
        lastName: profile.lastName ?? profile.name?.split(' ').slice(1).join(' ') ?? '',
        email: profile.email,
        phone: profile.phone ?? '',
        secondaryPhone: profile.secondaryPhone ?? '',
        lineId: profile.lineId ?? '',
        facebook: profile.facebook ?? '',
        wechat: profile.wechat ?? '',
        whatsapp: profile.whatsapp ?? '',
      })
    }
  }, [profile, reset])

  const mutation = useMutation({
    mutationFn: AuthService.updateProfile,
    onSuccess: (updated) => {
      toast.success(t('profile.updateSuccess'))
      queryClient.invalidateQueries({ queryKey: [AuthService.QUERY_KEYS.PROFILE] })
      if (token) login(token, updated)
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <PageContainer size="7xl">
      <PageTitle title={t('profile.title')} subtitle={t('profile.subtitle')} />

      <form onSubmit={handleSubmit((v) => mutation.mutate(v), scrollToFirstError)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('profile.identitySection')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput control={control} name="firstName" label={t('auth.firstName')} required />
              <FormInput control={control} name="lastName" label={t('auth.lastName')} required />
            </div>
            <FormInput control={control} name="email" label={t('auth.email')} type="email" required />
            {profile?.createdAt && (
              <p className="text-xs text-muted-foreground">
                {t('profile.memberSince')} {formatDate(profile.createdAt)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('profile.contactSection')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormPhoneInput control={control} name="phone" label={t('auth.phone')} required />
              <FormPhoneInput control={control} name="secondaryPhone" label={t('auth.secondaryPhone')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput control={control} name="lineId" label={t('auth.lineId')} />
              <FormInput control={control} name="facebook" label={t('auth.facebook')} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput control={control} name="wechat" label={t('auth.wechat')} />
              <FormInput control={control} name="whatsapp" label={t('auth.whatsapp')} />
            </div>
          </CardContent>
        </Card>

        {profile?.role === 'agent' && profile.agentCode && (
          <Card>
            <CardHeader><CardTitle className="text-base">{t('profile.agentSection')}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm">
                <span className="text-muted-foreground">{t('profile.agentCode')}: </span>
                <span className="font-mono font-medium">{profile.agentCode}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {profile?.role === 'user' && (
          <Card>
            <CardHeader><CardTitle className="text-base">{t('profile.activitySection')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <ProfileLink to={ROUTES.HISTORY} icon={<History className="size-4" />} label={t('sidebar.bookingHistory')} />
              <ProfileLink to={ROUTES.WISHLIST} icon={<Heart className="size-4" />} label={t('sidebar.wishlist')} />
              <ProfileLink to={ROUTES.CONTACTS} icon={<PhoneIcon className="size-4" />} label={t('sidebar.contactHistory')} />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}

function ProfileLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
    >
      <span className="flex items-center gap-3 text-sm font-medium text-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      <ChevronRight className="size-4 text-muted-foreground group-hover:text-muted-foreground" />
    </Link>
  )
}
