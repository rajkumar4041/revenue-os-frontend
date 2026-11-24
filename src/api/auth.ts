import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import type { AuthResponse, AuthUser, LoginRequest } from '@/types/auth'

export const login = (body: LoginRequest) =>
  api.post<AuthResponse>('/auth/login', body).then((r) => r.data)

export const fetchMe = () => api.get<AuthUser>('/auth/me').then((r) => r.data)

export const logoutRequest = (refreshToken: string) =>
  api.post('/auth/logout', { refreshToken }).then((r) => r.data)

export function useLogin() {
  return useMutation({ mutationFn: login })
}
