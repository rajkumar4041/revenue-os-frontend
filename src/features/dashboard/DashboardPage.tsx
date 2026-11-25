import { Building2, CheckSquare, FolderKanban, Users } from 'lucide-react'
import { useListClients, useListProjects, useListTasks, useListUsers } from '@/gen/hooks'
import { useAuth } from '@/store/auth'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth()

  // Count-only queries (size 1 → we just read totalElements) so cards show live numbers.
  const clients = useListClients({ page: 0, size: 1 }, { query: { enabled: hasPermission('CLIENT_VIEW') } })
  const projects = useListProjects({ page: 0, size: 1 }, { query: { enabled: hasPermission('PROJECT_VIEW') } })
  const users = useListUsers({ page: 0, size: 1 }, { query: { enabled: hasPermission('USER_MANAGE') } })
  const tasks = useListTasks({}, { query: { enabled: hasPermission('TASK_VIEW') } })

  const taskList = tasks.data ?? []
  const doneTasks = taskList.filter((t) => t.status === 'DONE').length
  const taskPct = taskList.length ? Math.round((doneTasks / taskList.length) * 100) : 0

  const count = (n?: number) => (n == null ? '—' : n.toLocaleString())

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground">Here’s what’s happening across your workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clients" value={count(clients.data?.totalElements)} icon={Building2} hint="total accounts" />
        <StatCard label="Projects" value={count(projects.data?.totalElements)} icon={FolderKanban} hint="in delivery" />
        <StatCard label="Tasks" value={count(taskList.length)} icon={CheckSquare} hint="tracked" />
        <StatCard label="Team" value={count(users.data?.totalElements)} icon={Users} hint="members" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Task completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-semibold">{taskPct}%</span>
              <span className="text-sm text-muted-foreground">
                {doneTasks} of {taskList.length} done
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${taskPct}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">{user?.roles[0] ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Permissions</span>
              <span className="font-medium">{user?.permissions.length ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
