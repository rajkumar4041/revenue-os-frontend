import axios, { type AxiosRequestConfig } from 'axios'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStorage'

const baseURL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// A single in-flight refresh is shared by all requests that hit a 401 at once.
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  try {
    const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken })
    setTokens(data.accessToken, data.refreshToken)
    return data.accessToken
  } catch {
    clearTokens()
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status
    const isAuthCall = original?.url?.includes('/auth/')

    if (status === 401 && original && !original._retry && !isAuthCall && getRefreshToken()) {
      original._retry = true
      refreshPromise = refreshPromise ?? refreshAccessToken()
      const newToken = await refreshPromise
      refreshPromise = null
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` }
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)
