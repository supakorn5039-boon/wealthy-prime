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

  const userMenu: MenuItem[] = [
    { labelKey: 'sidebar.wishlist', href: ROUTES.WISHLIST, icon: <Heart className="h-4 w-4" /> },
    { labelKey: 'sidebar.bookingHistory', href: ROUTES.HISTORY, icon: <History className="h-4 w-4" /> },
    { labelKey: 'sidebar.contactHistory', href: ROUTES.CONTACTS, icon: <Phone className="h-4 w-4" /> },
  ]

  const agentMenu: MenuItem[] = [
    { labelKey: 'sidebar.dashboard', href: ROUTES.AGENT_DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
    { labelKey: 'sidebar.allProperties', href: ROUTES.AGENT_PROPERTIES, icon: <Building2 className="h-4 w-4" /> },
    { labelKey: 'sidebar.visitRequests', href: ROUTES.AGENT_CONTACT_HISTORY, icon: <Calendar className="h-4 w-4" /> },
    { labelKey: 'sidebar.inquiries', href: ROUTES.AGENT_INQUIRIES, icon: <MessageSquare className="h-4 w-4" /> },
    { labelKey: 'sidebar.leads', href: ROUTES.AGENT_LEADS, icon: <Users className="h-4 w-4" /> },
    { labelKey: 'sidebar.agentProfile', href: ROUTES.AGENT_PROFILE, icon: <UserCircle className="h-4 w-4" /> },
    { labelKey: 'sidebar.agentOverview', href: ROUTES.AGENT_OVERVIEW, icon: <BarChart2 className="h-4 w-4" /> },
    { labelKey: 'sidebar.ownerLog', href: ROUTES.AGENT_OWNER_LOG, icon: <Eye className="h-4 w-4" /> },
  ]

  const adminMenu: MenuItem[] = [
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
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar text-white flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-2 font-bold text-base">
            <Crown className="h-5 w-5 text-amber-400" />
            <div className="leading-tight">
              <p className="text-sm font-bold">WEALTHY PRIME</p>
              <p className="text-xs text-white/60 font-normal">ESTATE</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {menu.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href + item.labelKey}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                {item.icon}
                {t(item.labelKey)}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 px-2 py-3">
          {user && (
            <div className="px-3 pb-2">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-white/50 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={() => { logout(); onClose() }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t('sidebar.logout')}
          </button>
        </div>
      </aside>
    </>
  )
}
