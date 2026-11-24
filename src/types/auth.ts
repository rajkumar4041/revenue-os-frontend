export interface AuthUser {
  id: string
  name: string
  email: string
  organizationId: string
  roles: string[]
  permissions: string[]
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
}

export interface LoginRequest {
  email: string
  password: string
}
