import type { UserRole } from '@/types/Auth'

export function canSeeOwnerInfo(role: UserRole | undefined): boolean {
  return role === 'admin' || role === 'agent'
}
