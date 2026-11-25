import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronsUpDown, LogOut } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { logoutRequest } from '@/api/auth'
import { clearTokens, getRefreshToken } from '@/lib/tokenStorage'
import { Avatar } from '@/components/ui/avatar'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  const handleLogout = async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) await logoutRequest(refreshToken).catch(() => undefined)
    clearTokens()
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative">
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent"
      >
        <Avatar name={user?.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs capitalize text-muted-foreground">
            {user?.roles[0]?.toLowerCase().replace(/_/g, ' ') ?? 'member'}
          </p>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-2 w-full overflow-hidden rounded-lg border bg-card p-1 shadow-lg">
          <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
