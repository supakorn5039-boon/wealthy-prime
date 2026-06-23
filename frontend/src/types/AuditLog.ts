import type { UserRole } from '@/types/Auth'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'reassign'
  | 'status_change'
  | 'role_change'
  | 'login'
  | 'password_reset'
  | 'note_update'
  | 'work_status_set'
  | 'view_owner'

export type AuditEntityType =
  | 'user'
  | 'agent'
  | 'property'
  | 'booking'
  | 'inquiry'
  | 'review'
  | ''

export interface AuditLog {
  id: number
  actorUserId: number | null
  actorName: string
  actorRole: UserRole | ''
  action: AuditAction
  entityType: string
  entityId: number | null
  summary: string
  metadata: string
  ip: string
  userAgent: string
  createdAt: string
}

export interface AuditLogFilters {
  actorRole?: UserRole
  action?: AuditAction
  entityType?: AuditEntityType
  search?: string
  limit?: number
  offset?: number
}
