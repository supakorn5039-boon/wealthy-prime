import { useAuthStore } from '@/store/authStore'

interface RoleSwitchProps {
  admin: React.ReactNode
  agent: React.ReactNode
}

export function RoleSwitch({ admin, agent }: RoleSwitchProps) {
  const role = useAuthStore((s) => s.user?.role)
  return <>{role === 'admin' ? admin : agent}</>
}
