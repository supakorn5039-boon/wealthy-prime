import { Link } from 'react-router-dom'
import { ShoppingCart, Menu, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/hooks/useCartStore'
import { ROUTES } from '@/constants/Routes'

interface NavbarProps {
  onMenuClick?: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const { items, openCart } = useCartStore()
  const isUserRole = !user || user.role === 'user'

  return (
    <header className="h-16 bg-white border-b sticky top-0 z-30 flex items-center px-4 gap-3">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <Link to={ROUTES.HOME} className="flex items-center gap-2 text-primary font-bold text-lg shrink-0">
        <Crown className="h-6 w-6 text-amber-500" />
        <span className="hidden sm:block">Wealthy Prime Estate</span>
        <span className="sm:hidden font-bold">WPE</span>
      </Link>

      <nav className="hidden lg:flex items-center gap-1 ml-4">
        <Link to={ROUTES.HOME}>
          <Button variant="ghost" size="sm" className="text-sm font-medium">{t('nav.home')}</Button>
        </Link>
        <Link to={ROUTES.HOME}>
          <Button variant="ghost" size="sm" className="text-sm font-medium">{t('nav.search')}</Button>
        </Link>
        <Link to={ROUTES.MAP}>
          <Button variant="ghost" size="sm" className="text-sm font-medium">{t('nav.map')}</Button>
        </Link>
      </nav>

      <div className="flex-1" />

      <LanguageSwitcher />

      {isUserRole && (
        <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {items.length}
            </span>
          )}
        </Button>
      )}

      {user ? (
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{t(`role.${user.role}`)}</p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link to={ROUTES.LOGIN}>
            <Button variant="ghost" size="sm">{t('nav.login')}</Button>
          </Link>
          <Link to={ROUTES.REGISTER}>
            <Button size="sm">{t('nav.register')}</Button>
          </Link>
        </div>
      )}
    </header>
  )
}
