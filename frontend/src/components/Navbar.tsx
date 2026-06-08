import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Logo } from '@/components/Logo'
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
  const navigate = useNavigate()
  const isUserRole = !user || user.role === 'user'

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME, { replace: true })
  }

  const navLinks: NavLink[] = [
    { to: ROUTES.HOME, label: t('nav.home') },
    { to: ROUTES.HOME, label: t('nav.search') },
    { to: ROUTES.MAP, label: t('nav.map') },
  ]

  return (
    <header className="h-16 sticky top-0 z-[1100] bg-background/80 backdrop-blur-md border-b border-border text-foreground flex items-center px-4 gap-3">
      {user && (
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground hover:bg-muted"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <Link to={ROUTES.HOME} className="flex items-center gap-3 shrink-0">
        <Logo size={36} />
        {!user && (
          <div className="leading-tight">
            <p className="hidden sm:block text-sm font-bold tracking-luxury text-primary">WEALTHY PRIME</p>
            <p className="hidden sm:block text-[10px] tracking-luxury text-muted-foreground">ESTATE CO., LTD.</p>
            <span className="sm:hidden font-bold tracking-luxury text-primary">WPE</span>
          </div>
        )}
      </Link>

      <nav className="hidden lg:flex items-center gap-1 ml-6">
        {navLinks.map((link, i) => {
          const isActive = i === 0 && location.pathname === ROUTES.HOME
          return (
            <Link key={`${link.to}-${i}`} to={link.to}>
              <button
                className={cn(
                  'relative px-4 py-1.5 text-sm font-medium tracking-luxury uppercase transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-foreground/80 hover:text-foreground'
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute left-3 right-3 -bottom-0.5 h-[2px] bg-primary" />
                )}
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
          className="relative text-foreground hover:bg-muted"
          onClick={openCart}
        >
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {items.length}
            </span>
          )}
        </Button>
      )}

      {user ? (
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{t(`role.${user.role}`)}</p>
          </div>
          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex rounded-md border border-border bg-muted hover:bg-muted/70 text-foreground text-sm font-medium px-4 py-1.5"
          >
            {t('nav.logout')}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link to={ROUTES.REGISTER}>
            <button className="hidden sm:inline-flex rounded-md text-foreground/80 hover:text-foreground hover:bg-muted text-sm font-medium px-4 py-1.5 tracking-luxury uppercase">
              {t('nav.register')}
            </button>
          </Link>
          <Link to={ROUTES.LOGIN}>
            <button className="rounded-md bg-primary hover:bg-accent text-primary-foreground text-sm font-semibold px-5 py-1.5 tracking-luxury uppercase transition-colors">
              {t('nav.login')}
            </button>
          </Link>
        </div>
      )}
    </header>
  )
}
