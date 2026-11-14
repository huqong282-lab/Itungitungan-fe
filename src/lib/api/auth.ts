import { apiClient, type ApiResponse } from './client'

export type AuthUser = { id: string; email: string; name: string }
export type RegisterRequest = { email: string; password: string; name: string }
export type LoginRequest = { email: string; password: string }
export type CurrentUser = AuthUser & { createdAt: string; updatedAt: string }

export const authApi = {
  register: (body: RegisterRequest) => apiClient.post<ApiResponse<{ user: AuthUser }>>('auth/register', body),
  login: (body: LoginRequest) => apiClient.post<ApiResponse<{ user: Pick<AuthUser, 'id' | 'email'> }>>('auth/login', body),
  logout: () => apiClient.post<void>('auth/logout'),
  getCurrentUser: () => apiClient.get<ApiResponse<CurrentUser>>('auth/me'),
}
