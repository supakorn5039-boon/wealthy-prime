export type UserRole = 'user' | 'agent' | 'admin'

export interface AuthUser {
  id: number
  name: string
  email: string
  phone: string
  role: UserRole
  createdAt: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  phone: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  user: AuthUser
}
