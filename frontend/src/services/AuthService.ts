import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { AuthResponse, LoginPayload, RegisterPayload, AuthUser } from '@/types/Auth'
import type { ApiResponse } from '@/types/Commons'

const IS_MOCK = import.meta.env.VITE_MOCK_API === 'true'

export const AuthService = {
  QUERY_KEYS: {
    PROFILE: 'auth-profile',
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    if (IS_MOCK) {
      await new Promise(r => setTimeout(r, 500))
      const { MOCK_USER, MOCK_AGENT, MOCK_ADMIN } = await import('@/mocks/data')
      const userMap: Record<string, AuthUser> = {
        'user@wpe.com': MOCK_USER,
        'agent@wpe.com': MOCK_AGENT,
        'admin@wpe.com': MOCK_ADMIN,
      }
      const user = userMap[payload.email]
      if (!user) throw new Error('Incorrect email or password')
      return { token: `mock-token-${user.role}`, user }
    }
    const res = await fetchClient.post<ApiResponse<AuthResponse>>(API.AUTH_LOGIN, payload)
    return res.data.data
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    if (IS_MOCK) {
      await new Promise(r => setTimeout(r, 500))
      const user: AuthUser = {
        id: Math.floor(Math.random() * 9000) + 1000,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        createdAt: new Date().toISOString(),
      }
      return { token: `mock-token-${user.role}`, user }
    }
    const res = await fetchClient.post<ApiResponse<AuthResponse>>(API.AUTH_REGISTER, payload)
    return res.data.data
  },

  getProfile: async (): Promise<AuthUser> => {
    if (IS_MOCK) {
      const { MOCK_USER } = await import('@/mocks/data')
      return MOCK_USER
    }
    const res = await fetchClient.get<ApiResponse<AuthUser>>(API.AUTH_PROFILE)
    return res.data.data
  },
}
