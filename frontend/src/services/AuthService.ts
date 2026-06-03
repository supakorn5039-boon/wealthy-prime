import { fetchClient } from '@/utils/axios'
import { API } from '@/constants/ApiRoutes'
import type { AuthResponse, LoginPayload, RegisterPayload, AuthUser, UpdateProfilePayload } from '@/types/Auth'
import type { ApiResponse } from '@/types/Commons'

export const AuthService = {
  QUERY_KEYS: {
    PROFILE: 'auth-profile',
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await fetchClient.post<ApiResponse<AuthResponse>>(API.AUTH_LOGIN, payload)
    return res.data.data
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await fetchClient.post<ApiResponse<AuthResponse>>(API.AUTH_REGISTER, payload)
    return res.data.data
  },

  getProfile: async (): Promise<AuthUser> => {
    const res = await fetchClient.get<ApiResponse<AuthUser>>(API.AUTH_PROFILE)
    return res.data.data
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<AuthUser> => {
    const res = await fetchClient.put<ApiResponse<AuthUser>>(API.AUTH_PROFILE, payload)
    return res.data.data
  },
}
