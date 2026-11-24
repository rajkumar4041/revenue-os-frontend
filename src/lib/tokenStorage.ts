// Tokens live in localStorage so the Axios layer can read them synchronously,
// outside of React. Global UI state (the current user) lives in the store.

const ACCESS_KEY = 'revenueos.accessToken'
const REFRESH_KEY = 'revenueos.refreshToken'

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY)
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY)

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}
