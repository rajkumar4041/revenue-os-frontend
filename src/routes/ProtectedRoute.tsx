import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { fetchMe } from '@/api/auth'
import { useAuth } from '@/store/auth'
import { clearTokens, getAccessToken } from '@/lib/tokenStorage'

/**
 * Gate for authenticated routes. If a token exists but the user isn't in the
 * store yet (e.g. after a page refresh), it rehydrates from /me before rendering.
 */
export default function ProtectedRoute() {
  const location = useLocation()
  const { user, setUser } = useAuth()
  const hasToken = !!getAccessToken()

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: hasToken && !user,
    retry: false,
  })

  // Depend only on the fetched data (a stable reference). `setUser` is a fresh
  // closure every render, so including it here would loop endlessly.
  useEffect(() => {
    if (meQuery.data) setUser(meQuery.data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meQuery.data])

  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (!user && meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user && meQuery.isError) {
    clearTokens()
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
