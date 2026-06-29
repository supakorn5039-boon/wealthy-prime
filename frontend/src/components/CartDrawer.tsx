import { useEffect, useState } from 'react'
import { X, Trash2, ShoppingCart, CalendarDays, ChevronDown } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCartStore } from '@/hooks/useCartStore'
import { BookingService } from '@/services/BookingService'
import { formatPrice } from '@/utils/date'
import { useAuthStore } from '@/store/authStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/Routes'
import { cn } from '@/lib/utils'

interface ContactForm {
  firstName: string
  lastName: string
  phone: string
  secondaryPhone: string
  latestContact: string
  lineId: string
  email: string
  facebook: string
  wechat: string
  whatsapp: string
}

const emptyContact: ContactForm = {
  firstName: '',
  lastName: '',
  phone: '',
  secondaryPhone: '',
  latestContact: '',
  lineId: '',
  email: '',
  facebook: '',
  wechat: '',
  whatsapp: '',
}

export function CartDrawer() {
  const { t } = useTranslation()
  const { items, isOpen, closeCart, removeItem, updateDate, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [contact, setContact] = useState<ContactForm>(emptyContact)
  const [showContact, setShowContact] = useState(false)

  // Prefill contact from user profile whenever the user changes.
  useEffect(() => {
    if (!user) return
    setContact({
      firstName: user.firstName ?? user.name?.split(' ')[0] ?? '',
      lastName: user.lastName ?? user.name?.split(' ').slice(1).join(' ') ?? '',
      phone: user.phone ?? '',
      secondaryPhone: user.secondaryPhone ?? '',
      latestContact: user.phone ?? '',
      lineId: user.lineId ?? '',
      email: user.email ?? '',
      facebook: user.facebook ?? '',
      wechat: user.wechat ?? '',
      whatsapp: user.whatsapp ?? '',
    })
  }, [user])

  const bookingMutation = useMutation({
    mutationFn: async () => {
      const results = []
      for (const item of items) {
        if (!item.appointmentDate) throw new Error(t('cart.selectDateRequired', { title: item.propertyTitle }))
        results.push(
          await BookingService.create({
            propertyId: item.propertyId,
            appointmentDate: item.appointmentDate.toISOString(),
            ...contact,
          }),
        )
      }
      return results
    },
    onSuccess: () => {
      toast.success(t('cart.success'), {
        description: t('cart.successSpamHint'),
        duration: 8000,
      })
      clearCart()
      closeCart()
      queryClient.invalidateQueries({ queryKey: [BookingService.QUERY_KEYS.LIST] })
      navigate(ROUTES.HISTORY)
    },
    onError: (err: Error) => {
      toast.error(err.message || t('cart.error'))
    },
  })

  const handleCheckout = () => {
    if (!user) {
      toast.error(t('cart.loginRequired'))
      navigate(ROUTES.LOGIN, { state: { from: location } })
      closeCart()
      return
    }
    bookingMutation.mutate()
  }

  const updateContact = (k: keyof ContactForm, v: string) => setContact((p) => ({ ...p, [k]: v }))

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={closeCart} />}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-screen w-full max-w-sm bg-card shadow-xl flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <ShoppingCart className="size-5 text-primary" />
            {t('cart.title')}
            {items.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">{items.length}</span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <ShoppingCart className="size-12 text-muted-foreground/60" />
              <p className="text-muted-foreground">{t('cart.empty')}</p>
              <Button variant="outline" size="sm" onClick={closeCart}>
                {t('cart.browseProperties')}
              </Button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.propertyId} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{item.propertyTitle}</p>
                      <p className="text-primary font-semibold text-sm mt-0.5">{formatPrice(item.propertyPrice)}</p>
                      <span className="text-xs text-muted-foreground">{t(`property.${item.propertyType}`)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 size-8"
                      onClick={() => removeItem(item.propertyId)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      <span>{t('cart.appointmentDate')}</span>
                      <span className="text-red-500">*</span>
                    </div>
                    <DatePicker
                      selected={item.appointmentDate}
                      onChange={(date) => updateDate(item.propertyId, date)}
                      minDate={new Date()}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={30}
                      filterTime={(time) => time.getTime() > Date.now()}
                      dateFormat="dd/MM/yyyy HH:mm"
                      placeholderText={t('cart.selectDateTime')}
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              ))}

              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowContact((s) => !s)}
                  className="w-full flex items-center justify-between p-3 text-sm font-medium"
                >
                  <span>{t('cart.contactSection')}</span>
                  <ChevronDown className={cn('size-4 transition-transform', showContact && 'rotate-180')} />
                </button>
                {showContact && (
                  <div className="p-3 pt-0 space-y-2">
                    <p className="text-xs text-muted-foreground">{t('cart.contactPrefilledHint')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">{t('auth.firstName')}</Label>
                        <Input value={contact.firstName} onChange={(e) => updateContact('firstName', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">{t('auth.lastName')}</Label>
                        <Input value={contact.lastName} onChange={(e) => updateContact('lastName', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">{t('auth.phone')}</Label>
                        <Input placeholder={t('common.phonePlaceholder')} value={contact.phone} onChange={(e) => updateContact('phone', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">{t('auth.secondaryPhone')}</Label>
                        <Input placeholder={t('common.phonePlaceholder')} value={contact.secondaryPhone} onChange={(e) => updateContact('secondaryPhone', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">{t('cart.latestContact')}</Label>
                      <Input
                        placeholder={t('common.phonePlaceholder')}
                        value={contact.latestContact}
                        onChange={(e) => updateContact('latestContact', e.target.value)}
                      />
                      <p className="mt-1 text-[10px] text-muted-foreground">{t('cart.latestContactHint')}</p>
                    </div>
                    <div>
                      <Label className="text-xs">{t('auth.email')}</Label>
                      <Input type="email" value={contact.email} onChange={(e) => updateContact('email', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">{t('auth.lineId')}</Label>
                        <Input value={contact.lineId} onChange={(e) => updateContact('lineId', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">{t('auth.facebook')}</Label>
                        <Input value={contact.facebook} onChange={(e) => updateContact('facebook', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">{t('auth.wechat')}</Label>
                        <Input value={contact.wechat} onChange={(e) => updateContact('wechat', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">{t('auth.whatsapp')}</Label>
                        <Input value={contact.whatsapp} onChange={(e) => updateContact('whatsapp', e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('cart.totalLabel')}</span>
              <span className="font-medium">{items.length} {t('cart.items')}</span>
            </div>
            <Button
              className="w-full"
              onClick={handleCheckout}
              disabled={bookingMutation.isPending}
            >
              {bookingMutation.isPending ? t('cart.submitting') : t('cart.checkout')}
            </Button>
            <Button variant="ghost" className="w-full text-sm" onClick={clearCart}>
              {t('cart.clearCart')}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
