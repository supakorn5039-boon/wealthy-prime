import type { UserRole } from '@/types/Auth'

// Mirror of backend `canSeeOwnerInfo` (property_controller.go) — the two
// MUST stay in sync; the backend will return null for users that fail this
// check, so showing the dialog button would just produce a dead button.
export function canSeeOwnerInfo(role: UserRole | undefined): boolean {
  return role === 'admin' || role === 'agent'
}
