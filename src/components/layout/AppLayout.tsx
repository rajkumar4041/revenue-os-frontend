import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Bell,
  Building2,
  CheckCheck,
  CheckSquare,
  Clock,
  FileText,
  FolderKanban,
  Receipt,
  LayoutDashboard,
  Network,
  Search,
  ShieldCheck,
  Target,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'
import { CommandPalette } from './CommandPalette'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  permission?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Sales',
    items: [
      { to: '/leads', label: 'Leads', icon: UserPlus, permission: 'CLIENT_VIEW' },
      { to: '/pipeline', label: 'Pipeline', icon: Target, permission: 'CLIENT_VIEW' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '/clients', label: 'Clients', icon: Building2, permission: 'CLIENT_VIEW' },
      { to: '/projects', label: 'Projects', icon: FolderKanban, permission: 'PROJECT_VIEW' },
      { to: '/tasks', label: 'Tasks', icon: CheckSquare, permission: 'TASK_VIEW' },
    ],
  },
  {
    label: 'Time',
    items: [
      { to: '/timesheets', label: 'Timesheets', icon: Clock, permission: 'TIMESHEET_SUBMIT' },
      { to: '/approvals', label: 'Approvals', icon: CheckCheck, permission: 'TIMESHEET_APPROVE' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/invoices', label: 'Invoices', icon: FileText, permission: 'INVOICE_VIEW' },
      { to: '/expenses', label: 'Expenses', icon: Receipt, permission: 'REVENUE_VIEW' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/employees', label: 'Employees', icon: UserCog, permission: 'EMPLOYEE_VIEW' },
      { to: '/departments', label: 'Departments', icon: Network, permission: 'EMPLOYEE_VIEW' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/users', label: 'Users', icon: Users, permission: 'USER_MANAGE' },
      { to: '/roles', label: 'Roles', icon: ShieldCheck, permission: 'ROLE_MANAGE' },
    ],
  },
]

export default function AppLayout() {
  const { hasPermission } = useAuth()
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="flex min-h-screen bg-background">
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            R
          </span>
          <span className="text-base font-semibold tracking-tight">RevenueOS</span>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {visibleGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-primary'
                        : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <UserMenu />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-5 backdrop-blur">
          <div className="flex items-center gap-2 font-semibold md:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              R
            </span>
            RevenueOS
          </div>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex md:w-72"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="rounded border bg-background px-1.5 text-xs">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
