export type UserRole = 'user' | 'agent' | 'admin'

export interface AuthUser {
  id: number
  name: string
  firstName?: string
  lastName?: string
  email: string
  phone: string
  secondaryPhone?: string
  lineId?: string
  facebook?: string
  wechat?: string
  whatsapp?: string
  agentCode?: string
  role: UserRole
  createdAt: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name?: string
  firstName?: string
  lastName?: string
  email: string
  password: string
  phone: string
  secondaryPhone?: string
  lineId?: string
  facebook?: string
  wechat?: string
  whatsapp?: string
  role: UserRole
}

export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  secondaryPhone?: string
  lineId?: string
  facebook?: string
  wechat?: string
  whatsapp?: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}
