import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Heart,
  History,
  Phone,
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  UserCircle,
  BarChart2,
  Eye,
  ClipboardList,
  UserCog,
  ArrowLeftRight,
  DollarSign,
  LogOut,
  X,
  Crown,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/Routes'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface MenuItem {
  labelKey: string
  href: string
  icon: React.ReactNode
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const profileItem: MenuItem = { labelKey: 'sidebar.personalInfo', href: ROUTES.PROFILE, icon: <UserCircle className="h-4 w-4" /> }

  const userMenu: MenuItem[] = [
    profileItem,
    { labelKey: 'sidebar.bookingHistory', href: ROUTES.HISTORY, icon: <History className="h-4 w-4" /> },
    { labelKey: 'sidebar.wishlist', href: ROUTES.WISHLIST, icon: <Heart className="h-4 w-4" /> },
    { labelKey: 'sidebar.contactHistory', href: ROUTES.CONTACTS, icon: <Phone className="h-4 w-4" /> },
  ]

  const agentMenu: MenuItem[] = [
    profileItem,
    { labelKey: 'sidebar.dashboard', href: ROUTES.AGENT_DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
    { labelKey: 'sidebar.allProperties', href: ROUTES.AGENT_PROPERTIES, icon: <Building2 className="h-4 w-4" /> },
    { labelKey: 'sidebar.visitRequests', href: ROUTES.AGENT_CONTACT_HISTORY, icon: <Calendar className="h-4 w-4" /> },
    { labelKey: 'sidebar.inquiries', href: ROUTES.AGENT_INQUIRIES, icon: <MessageSquare className="h-4 w-4" /> },
    { labelKey: 'sidebar.leads', href: ROUTES.AGENT_LEADS, icon: <Users className="h-4 w-4" /> },
    { labelKey: 'sidebar.agentOverview', href: ROUTES.AGENT_OVERVIEW, icon: <BarChart2 className="h-4 w-4" /> },
    { labelKey: 'sidebar.ownerLog', href: ROUTES.AGENT_OWNER_LOG, icon: <Eye className="h-4 w-4" /> },
  ]

  const adminMenu: MenuItem[] = [
    profileItem,
    { labelKey: 'sidebar.dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
    { labelKey: 'sidebar.pendingApproval', href: ROUTES.ADMIN_PENDING, icon: <ClipboardList className="h-4 w-4" /> },
    { labelKey: 'sidebar.agentManagement', href: ROUTES.ADMIN_AGENTS, icon: <UserCog className="h-4 w-4" /> },
    { labelKey: 'sidebar.userManagement', href: ROUTES.ADMIN_USERS, icon: <Users className="h-4 w-4" /> },
    { labelKey: 'sidebar.caseTransfer', href: ROUTES.ADMIN_REASSIGN, icon: <ArrowLeftRight className="h-4 w-4" /> },
    { labelKey: 'sidebar.financialReport', href: ROUTES.ADMIN_FINANCIAL, icon: <DollarSign className="h-4 w-4" /> },
    { labelKey: 'sidebar.allProperties', href: ROUTES.AGENT_PROPERTIES, icon: <Building2 className="h-4 w-4" /> },
    { labelKey: 'sidebar.visitRequests', href: ROUTES.AGENT_CONTACT_HISTORY, icon: <Calendar className="h-4 w-4" /> },
    { labelKey: 'sidebar.inquiries', href: ROUTES.AGENT_INQUIRIES, icon: <MessageSquare className="h-4 w-4" /> },
    { labelKey: 'sidebar.leads', href: ROUTES.AGENT_LEADS, icon: <Users className="h-4 w-4" /> },
    { labelKey: 'sidebar.agentOverview', href: ROUTES.AGENT_OVERVIEW, icon: <BarChart2 className="h-4 w-4" /> },
    { labelKey: 'sidebar.ownerLog', href: ROUTES.AGENT_OWNER_LOG, icon: <Eye className="h-4 w-4" /> },
  ]

  const menu =
    user?.role === 'admin' ? adminMenu : user?.role === 'agent' ? agentMenu : userMenu

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[1050] bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-[1090] h-screen bg-sidebar text-white flex flex-col transition-all duration-300 overflow-hidden',
          // Mobile width is 256px. Translate off-canvas when closed.
          'w-64',
          open ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible in-flow; width depends on open state (collapsed = icon rail).
          'lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto',
          open ? 'lg:w-64' : 'lg:w-16'
        )}
      >
        <div className="flex items-center justify-between h-16 px-3 border-b border-white/10 shrink-0">
          <Link
            to={ROUTES.HOME}
            className={cn(
              'flex items-center gap-2 font-bold text-base min-w-0',
              !open && 'lg:justify-center lg:w-full'
            )}
          >
            <Crown className="h-5 w-5 text-amber-400 shrink-0" />
            <div className={cn('leading-tight min-w-0', !open && 'lg:hidden')}>
              <p className="text-sm font-bold whitespace-nowrap">WEALTHY PRIME</p>
              <p className="text-xs text-white/60 font-normal whitespace-nowrap">ESTATE</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className={cn('text-white hover:bg-white/10 shrink-0', !open && 'lg:hidden')}
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
          {menu.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href + item.labelKey}
                to={item.href}
                title={t(item.labelKey)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 whitespace-nowrap',
                  !open && 'lg:justify-center lg:px-2',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className={cn(!open && 'lg:hidden')}>{t(item.labelKey)}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 px-2 py-3 shrink-0">
          {user && (
            <div className={cn('px-3 pb-2 min-w-0', !open && 'lg:hidden')}>
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-white/50 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            title={t('sidebar.logout')}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors whitespace-nowrap',
              !open && 'lg:justify-center lg:px-2'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn(!open && 'lg:hidden')}>{t('sidebar.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
