import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { KeyRound, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/form/FormInput'
import { FormPhoneInput } from '@/components/form/FormPhoneInput'
import { profileSchema, type ProfileSchema } from '@/dto/AuthValidation'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { formatDate } from '@/utils/date'
import { AdminService } from '@/services/AdminService'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/types/Auth'

interface EditProfileDialogProps {
  user: AuthUser
  open: boolean
  onClose: () => void
  updateFn: (id: number | string, payload: Partial<AuthUser>) => Promise<AuthUser>
  queryKey: string
}

export function EditProfileDialog({ user, open, onClose, updateFn, queryKey }: EditProfileDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const authUser = useAuthStore((s) => s.user)
  const isSelf = authUser?.id === user.id
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { control, handleSubmit } = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName ?? user.name?.split(' ')[0] ?? '',
      lastName: user.lastName ?? user.name?.split(' ').slice(1).join(' ') ?? '',
      email: user.email,
      phone: user.phone ?? '',
      secondaryPhone: user.secondaryPhone ?? '',
      lineId: user.lineId ?? '',
      facebook: user.facebook ?? '',
      wechat: user.wechat ?? '',
      whatsapp: user.whatsapp ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: ProfileSchema) => updateFn(user.id, values),
    onSuccess: () => {
      toast.success(t('admin.updateSuccess'))
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      queryClient.invalidateQueries({ queryKey: [AdminService.QUERY_KEYS.BOOKINGS] })
      queryClient.invalidateQueries({ queryKey: [AdminService.QUERY_KEYS.AUDIT_LOGS] })
      onClose()
    },
    onError: () => toast.error(t('common.error')),
  })

  const resetMutation = useMutation({
    mutationFn: () => AdminService.resetPassword(user.id),
    onSuccess: () => toast.success(t('admin.resetPasswordSent')),
    onError: () => toast.error(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: () => AdminService.deleteUser(user.id),
    onSuccess: () => {
      toast.success(t('admin.deleteUserSuccess'))
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      queryClient.invalidateQueries({ queryKey: [AdminService.QUERY_KEYS.BOOKINGS] })
      queryClient.invalidateQueries({ queryKey: [AdminService.QUERY_KEYS.AUDIT_LOGS] })
      setConfirmOpen(false)
      onClose()
    },
    onError: () => {
      toast.error(t('common.error'))
      setConfirmOpen(false)
    },
  })

  return (
    <>
    <Dialog open={open && !confirmOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('admin.editTitle')} {user.name}
          </DialogTitle>
          <DialogDescription>{t('admin.editProfileSubtitle')}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values), scrollToFirstError)}
          className="space-y-5"
        >
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t('profile.identitySection')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput control={control} name="firstName" label={t('auth.firstName')} required />
              <FormInput control={control} name="lastName" label={t('auth.lastName')} required />
            </div>
            <FormInput control={control} name="email" label={t('auth.email')} type="email" required />
            <p className="text-xs text-muted-foreground">
              {t('profile.memberSince')} {formatDate(user.createdAt)}
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t('profile.contactSection')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormPhoneInput control={control} name="phone" label={t('auth.phone')} required />
              <FormPhoneInput control={control} name="secondaryPhone" label={t('auth.secondaryPhone')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput control={control} name="lineId" label={t('auth.lineId')} />
              <FormInput control={control} name="facebook" label={t('auth.facebook')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput control={control} name="wechat" label={t('auth.wechat')} />
              <FormInput control={control} name="whatsapp" label={t('auth.whatsapp')} />
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t('admin.resetPassword')}</p>
              <p className="text-xs text-muted-foreground">{t('admin.resetPasswordHint')}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="shrink-0"
            >
              <KeyRound className="size-3.5 mr-1" />
              {resetMutation.isPending ? t('common.saving') : t('admin.resetPasswordButton')}
            </Button>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {isSelf ? (
              <span />
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(true)}
                className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5 mr-1" />
                {t('admin.deleteUser')}
              </Button>
            )}
            <div className="flex gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.deleteUserConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.deleteUserConfirmDesc', { name: user.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              deleteMutation.mutate()
            }}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? t('common.saving') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
