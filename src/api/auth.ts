import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import type { AuthResponse, AuthUser, LoginRequest } from '@/types/auth'

export const login = (body: LoginRequest) =>
  api.post<AuthResponse>('/api/v1/auth/login', body).then((r) => r.data)

export const fetchMe = () => api.get<AuthUser>('/api/v1/auth/me').then((r) => r.data)

export const logoutRequest = (refreshToken: string) =>
  api.post('/api/v1/auth/logout', { refreshToken }).then((r) => r.data)

export function useLogin() {
  return useMutation({ mutationFn: login })
}
