import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Menu, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/hooks/useCartStore'
import { ROUTES } from '@/constants/Routes'
import { cn } from '@/lib/utils'

interface NavbarProps {
  onMenuClick?: () => void
}

interface NavLink {
  to: string
  label: string
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const { items, openCart } = useCartStore()
  const location = useLocation()
  const isUserRole = !user || user.role === 'user'

  const navLinks: NavLink[] = [
    { to: ROUTES.HOME, label: t('nav.home') },
    { to: ROUTES.HOME, label: t('nav.search') },
    { to: ROUTES.MAP, label: t('nav.map') },
  ]

  return (
    <header className="h-16 sticky top-0 z-[1100] bg-slate-900/80 backdrop-blur-md border-b border-white/10 text-white flex items-center px-4 gap-3">
      {user && (
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <Link to={ROUTES.HOME} className="flex items-center gap-2 font-bold text-lg shrink-0 text-white">
        <Crown className="h-6 w-6 text-amber-400" />
        {!user && (
          <>
            <span className="hidden sm:block">Wealthy Prime Estate</span>
            <span className="sm:hidden font-bold">WPE</span>
          </>
        )}
      </Link>

      <nav className="hidden lg:flex items-center gap-1 ml-6">
        {navLinks.map((link, i) => {
          const isActive = i === 0 && location.pathname === ROUTES.HOME
          return (
            <Link key={`${link.to}-${i}`} to={link.to}>
              <button
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white text-slate-900'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
              </button>
            </Link>
          )
        })}
      </nav>

      <div className="flex-1" />

      <LanguageSwitcher />

      {isUserRole && (
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white hover:bg-white/10"
          onClick={openCart}
        >
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {items.length}
            </span>
          )}
        </Button>
      )}

      {user ? (
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-white/60">{t(`role.${user.role}`)}</p>
          </div>
          <button
            onClick={logout}
            className="hidden sm:inline-flex rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-1.5"
          >
            {t('nav.logout')}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link to={ROUTES.REGISTER}>
            <button className="hidden sm:inline-flex rounded-full text-white/80 hover:text-white hover:bg-white/10 text-sm font-medium px-4 py-1.5">
              {t('nav.register')}
            </button>
          </Link>
          <Link to={ROUTES.LOGIN}>
            <button className="rounded-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-5 py-1.5 border border-white/10">
              {t('nav.login')}
            </button>
          </Link>
        </div>
      )}
    </header>
  )
}
