import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { logoutRequest } from '@/api/auth'
import { clearTokens, getRefreshToken } from '@/lib/tokenStorage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  const handleLogout = async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      await logoutRequest(refreshToken).catch(() => undefined)
    }
    clearTokens()
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <span className="text-lg font-semibold">RevenueOS</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {user?.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Roles: </span>
              {user?.roles.join(', ') || '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Permissions: </span>
              {user?.permissions.length ?? 0} granted
            </div>
            <p className="pt-2 text-muted-foreground">
              You are signed in. The rest of RevenueOS is coming in the next phases.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
