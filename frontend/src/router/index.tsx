import { createBrowserRouter } from 'react-router-dom'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { BlankLayout } from '@/components/layouts/BlankLayout'
import { ProtectedAuthRoute } from '@/hooks/ProtectedAuthRoute'
import { RouteLayout } from '@/constants/Routes'
import { routes } from './routes'

const finalRoutes = routes.map((route) => ({
  path: route.path,
  element:
    route.layout === RouteLayout.BLANK ? (
      <BlankLayout>{route.element}</BlankLayout>
    ) : route.layout === RouteLayout.PROTECTED ? (
      <ProtectedAuthRoute allowedRoles={route.allowedRoles}>
        <DefaultLayout>{route.element}</DefaultLayout>
      </ProtectedAuthRoute>
    ) : (
      <DefaultLayout>{route.element}</DefaultLayout>
    ),
}))

export const router = createBrowserRouter(finalRoutes)
