import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ROUTES } from '@/constants/Routes'
import type { UserRole } from '@/types/Auth'

interface ProtectedAuthRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

const roleHomePage: Record<UserRole, string> = {
  admin: ROUTES.ADMIN_DASHBOARD,
  agent: ROUTES.AGENT_DASHBOARD,
  user: ROUTES.HOME,
}

export function ProtectedAuthRoute({ children, allowedRoles }: ProtectedAuthRouteProps) {
  const { t } = useTranslation()
  const { token, user, isHydrated, requestAuthFromOtherTabs } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (isHydrated && !token && !user) {
      requestAuthFromOtherTabs()
    }
  }, [isHydrated, token, user, requestAuthFromOtherTabs])

  if (!isHydrated) {
    return <LoadingSpinner text={t('common.loading')} />
  }

  if (!token || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (allowedRoles && user.role !== 'admin' && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHomePage[user.role] ?? ROUTES.HOME} replace />
  }

  return <>{children}</>
}
