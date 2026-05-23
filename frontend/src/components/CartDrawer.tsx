import { X, Trash2, ShoppingCart, CalendarDays } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/hooks/useCartStore'
import { BookingService } from '@/services/BookingService'
import { formatPrice } from '@/utils/date'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/Routes'
import { cn } from '@/lib/utils'

export function CartDrawer() {
  const { t } = useTranslation()
  const { items, isOpen, closeCart, removeItem, updateDate, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const bookingMutation = useMutation({
    mutationFn: async () => {
      const results = []
      for (const item of items) {
        if (!item.appointmentDate) throw new Error(t('cart.selectDateRequired', { title: item.propertyTitle }))
        results.push(
          await BookingService.create({
            propertyId: item.propertyId,
            appointmentDate: item.appointmentDate.toISOString(),
          })
        )
      }
      return results
    },
    onSuccess: () => {
      toast.success(t('cart.success'))
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
      navigate(ROUTES.LOGIN)
      closeCart()
      return
    }
    bookingMutation.mutate()
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={closeCart} />}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-screen w-full max-w-sm bg-white shadow-xl flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {t('cart.title')}
            {items.length > 0 && (
              <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5">{items.length}</span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500">{t('cart.empty')}</p>
              <Button variant="outline" size="sm" onClick={closeCart}>
                {t('cart.browseProperties')}
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.propertyId} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{item.propertyTitle}</p>
                    <p className="text-primary font-semibold text-sm mt-0.5">{formatPrice(item.propertyPrice)}</p>
                    <span className="text-xs text-gray-400">{t(`property.${item.propertyType}`)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                    onClick={() => removeItem(item.propertyId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <CalendarDays className="h-3.5 w-3.5" />
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
                    dateFormat="dd/MM/yyyy HH:mm"
                    placeholderText={t('cart.selectDateTime')}
                    className="w-full text-sm"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('cart.totalLabel')}</span>
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
