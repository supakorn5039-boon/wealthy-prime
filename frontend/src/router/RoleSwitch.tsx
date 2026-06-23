import { useAuthStore } from '@/store/authStore'

interface RoleSwitchProps {
  admin: React.ReactNode
  agent: React.ReactNode
}

// Dispatches to admin or agent component based on the logged-in role.
// Used for URLs that map to different pages depending on role
// (e.g., /dashboard, /visit-requests).
export function RoleSwitch({ admin, agent }: RoleSwitchProps) {
  const role = useAuthStore((s) => s.user?.role)
  return <>{role === 'admin' ? admin : agent}</>
}
