import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Building2, CheckSquare, FolderKanban, Users } from 'lucide-react'
import {
  useListClients,
  useListProjects,
  useListTasks,
  useListUsers,
  useMonthlyRevenue,
  useRevenueSummary,
} from '@/gen/hooks'
import { useAuth } from '@/store/auth'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const money = (n?: number) =>
  (n ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export default function DashboardPage() {
  const { user, hasPermission } = useAuth()
  const canRevenue = hasPermission('REVENUE_VIEW')

  const clients = useListClients({ page: 0, size: 1 }, { query: { enabled: hasPermission('CLIENT_VIEW') } })
  const projects = useListProjects({ page: 0, size: 1 }, { query: { enabled: hasPermission('PROJECT_VIEW') } })
  const users = useListUsers({ page: 0, size: 1 }, { query: { enabled: hasPermission('USER_MANAGE') } })
  const tasks = useListTasks({}, { query: { enabled: hasPermission('TASK_VIEW') } })
  const summary = useRevenueSummary({ query: { enabled: canRevenue } })
  const monthly = useMonthlyRevenue({ months: 6 }, { query: { enabled: canRevenue } })

  const taskList = tasks.data ?? []
  const doneTasks = taskList.filter((t) => t.status === 'DONE').length
  const taskPct = taskList.length ? Math.round((doneTasks / taskList.length) * 100) : 0
  const count = (n?: number) => (n == null ? '—' : n.toLocaleString())

  const chartData = (monthly.data ?? []).map((p) => ({
    month: p.month?.slice(5),
    invoiced: Number(p.invoiced ?? 0),
    collected: Number(p.collected ?? 0),
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground">Here’s what’s happening across your workspace.</p>
      </div>

      {canRevenue && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Invoiced" value={money(summary.data?.totalInvoiced)} icon={FolderKanban} hint="billed" />
          <StatCard label="Collected" value={money(summary.data?.totalCollected)} icon={Building2} hint="received" />
          <StatCard label="Outstanding" value={money(summary.data?.outstanding)} icon={CheckSquare} hint="unpaid" />
          <StatCard label="Net profit" value={money(summary.data?.netProfit)} icon={Users} hint="collected − expenses" />
        </div>
      )}

      {canRevenue && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoiced vs collected (last 6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 4 }}>
                  <defs>
                    <linearGradient id="invoiced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="collected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} width={48} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="invoiced" stroke="hsl(var(--primary))" fill="url(#invoiced)" strokeWidth={2} />
                  <Area type="monotone" dataKey="collected" stroke="#10b981" fill="url(#collected)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clients" value={count(clients.data?.totalElements)} icon={Building2} hint="total" />
        <StatCard label="Projects" value={count(projects.data?.totalElements)} icon={FolderKanban} hint="in delivery" />
        <StatCard label="Tasks" value={count(taskList.length)} icon={CheckSquare} hint="tracked" />
        <StatCard label="Team" value={count(users.data?.totalElements)} icon={Users} hint="members" />
      </div>

      <Card>
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
    </div>
  )
}
