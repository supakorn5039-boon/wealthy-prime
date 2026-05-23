import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ROUTES } from '@/constants/Routes'

interface ProtectedAuthRouteProps {
  children: React.ReactNode
}

export function ProtectedAuthRoute({ children }: ProtectedAuthRouteProps) {
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

  return <>{children}</>
}
