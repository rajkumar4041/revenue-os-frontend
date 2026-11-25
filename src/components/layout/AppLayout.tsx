import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { logoutRequest } from '@/api/auth'
import { clearTokens, getRefreshToken } from '@/lib/tokenStorage'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  permission?: string
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users, permission: 'USER_MANAGE' },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const { user, setUser, hasPermission } = useAuth()

  const handleLogout = async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) await logoutRequest(refreshToken).catch(() => undefined)
    clearTokens()
    setUser(null)
    navigate('/login', { replace: true })
  }

  const visibleNav = NAV.filter((item) => !item.permission || hasPermission(item.permission))

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center px-6 text-lg font-semibold">RevenueOS</div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <span className="text-sm text-muted-foreground md:hidden">RevenueOS</span>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
