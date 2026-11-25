import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CheckCheck,
  CheckSquare,
  Clock,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Moon,
  Network,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { useTheme } from '@/store/theme'
import { logoutRequest } from '@/api/auth'
import { clearTokens, getRefreshToken } from '@/lib/tokenStorage'
import { cn } from '@/lib/utils'

interface Command {
  id: string
  label: string
  icon: LucideIcon
  perform: () => void
  permission?: string
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate()
  const { hasPermission, setUser } = useAuth()
  const { toggle } = useTheme()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = () => {
    setQuery('')
    onOpenChange(false)
  }

  const go = (to: string) => () => {
    navigate(to)
    close()
  }

  const handleLogout = async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) await logoutRequest(refreshToken).catch(() => undefined)
    clearTokens()
    setUser(null)
    close()
    navigate('/login', { replace: true })
  }

  const commands: Command[] = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, perform: go('/') },
    { id: 'clients', label: 'Go to Clients', icon: Building2, perform: go('/clients'), permission: 'CLIENT_VIEW' },
    { id: 'projects', label: 'Go to Projects', icon: FolderKanban, perform: go('/projects'), permission: 'PROJECT_VIEW' },
    { id: 'tasks', label: 'Go to Tasks', icon: CheckSquare, perform: go('/tasks'), permission: 'TASK_VIEW' },
    { id: 'timesheets', label: 'Go to Timesheets', icon: Clock, perform: go('/timesheets'), permission: 'TIMESHEET_SUBMIT' },
    { id: 'approvals', label: 'Go to Approvals', icon: CheckCheck, perform: go('/approvals'), permission: 'TIMESHEET_APPROVE' },
    { id: 'employees', label: 'Go to Employees', icon: UserCog, perform: go('/employees'), permission: 'EMPLOYEE_VIEW' },
    { id: 'teams', label: 'Go to Teams', icon: Network, perform: go('/teams'), permission: 'EMPLOYEE_VIEW' },
    { id: 'users', label: 'Go to Users', icon: Users, perform: go('/users'), permission: 'USER_MANAGE' },
    { id: 'roles', label: 'Go to Roles', icon: ShieldCheck, perform: go('/roles'), permission: 'ROLE_MANAGE' },
    { id: 'theme', label: 'Toggle theme', icon: Moon, perform: () => { toggle(); close() } },
    { id: 'logout', label: 'Sign out', icon: LogOut, perform: handleLogout },
  ].filter((command) => !command.permission || hasPermission(command.permission))

  const results = useMemo(
    () => commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query],
  )

  useEffect(() => setIndex(0), [query])
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  if (!open) return null

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      results[index]?.perform()
    } else if (e.key === 'Escape') {
      close()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]">
      <div className="fixed inset-0 bg-black/40" onClick={close} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border bg-card shadow-xl">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a command or search…"
          className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No results</li>
          ) : (
            results.map((command, i) => {
              const Icon = command.icon
              return (
                <li key={command.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setIndex(i)}
                    onClick={command.perform}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      i === index ? 'bg-accent text-accent-foreground' : 'hover:bg-secondary',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {command.label}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
