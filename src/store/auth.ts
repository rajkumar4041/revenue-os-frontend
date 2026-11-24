import { useReduxState } from 'redux-toolkit-state'
import type { AuthUser } from '@/types/auth'

interface AuthState {
  user: AuthUser | null
}

const AUTH_KEY = 'auth'
const initialState: AuthState = { user: null }

/**
 * Global auth state backed by redux-toolkit-state. Holds the current user for
 * the React tree; access/refresh tokens are kept in localStorage for the API
 * layer and are intentionally not stored here.
 */
export function useAuth() {
  const [state, setState] = useReduxState<AuthState>(AUTH_KEY, initialState)

  return {
    user: state.user,
    isAuthenticated: state.user !== null,
    setUser: (user: AuthUser | null) => setState({ user }),
    hasPermission: (permission: string) => state.user?.permissions.includes(permission) ?? false,
  }
}
