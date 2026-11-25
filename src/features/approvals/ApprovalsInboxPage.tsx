import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, X } from 'lucide-react'
import {
  useApproveExpense,
  useApproveTimesheet,
  useListExpenses,
  usePendingTimesheets,
  useRejectExpense,
  useRejectTimesheet,
} from '@/gen/hooks'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Kind = 'timesheet' | 'expense'

interface InboxItem {
  key: string
  id: string
  kind: Kind
  title: string
  subtitle: string
  amount: string
}

const money = (n?: number) => (n ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })

export default function ApprovalsInboxPage() {
  const { hasPermission } = useAuth()
  const canTime = hasPermission('TIMESHEET_APPROVE')
  const canExpense = hasPermission('REVENUE_MANAGE')
  const queryClient = useQueryClient()

  const timesheets = usePendingTimesheets({ query: { enabled: canTime } })
  const expenses = useListExpenses({ page: 0, size: 100, status: 'PENDING' }, { query: { enabled: canExpense } })

  const approveTimesheet = useApproveTimesheet()
  const rejectTimesheet = useRejectTimesheet()
  const approveExpense = useApproveExpense()
  const rejectExpense = useRejectExpense()

  const [filter, setFilter] = useState<'all' | Kind>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const items = useMemo<InboxItem[]>(() => {
    const ts: InboxItem[] = (timesheets.data ?? []).map((t) => ({
      key: `timesheet:${t.id}`,
      id: t.id!,
      kind: 'timesheet',
      title: 'Timesheet',
      subtitle: `${t.periodStart} – ${t.periodEnd}`,
      amount: `${Number(t.totalHours ?? 0)} h`,
    }))
    const ex: InboxItem[] = (expenses.data?.content ?? []).map((e) => ({
      key: `expense:${e.id}`,
      id: e.id!,
      kind: 'expense',
      title: `Expense · ${e.category}`,
      subtitle: e.incurredOn ?? '',
      amount: money(e.amount),
    }))
    return [...ts, ...ex]
  }, [timesheets.data, expenses.data])

  const visible = items.filter((i) => filter === 'all' || i.kind === filter)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/timesheets/pending' }] })
    queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/expenses' }] })
    setSelected(new Set())
  }

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const toggleAll = () =>
    setSelected((prev) => (prev.size === visible.length ? new Set() : new Set(visible.map((i) => i.key))))

  const act = async (item: InboxItem, decision: 'approve' | 'reject') => {
    if (item.kind === 'timesheet') {
      if (decision === 'approve') await approveTimesheet.mutateAsync({ id: item.id })
      else await rejectTimesheet.mutateAsync({ id: item.id, data: { note: 'Rejected from inbox' } })
    } else {
      if (decision === 'approve') await approveExpense.mutateAsync({ id: item.id })
      else await rejectExpense.mutateAsync({ id: item.id })
    }
  }

  const bulk = async (decision: 'approve' | 'reject') => {
    const chosen = visible.filter((i) => selected.has(i.key))
    if (chosen.length === 0) return
    setBusy(true)
    try {
      await Promise.all(chosen.map((i) => act(i, decision)))
    } finally {
      setBusy(false)
      refresh()
    }
  }

  const single = async (item: InboxItem, decision: 'approve' | 'reject') => {
    setBusy(true)
    try {
      await act(item, decision)
    } finally {
      setBusy(false)
      refresh()
    }
  }

  if (!canTime && !canExpense) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have anything to approve.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const loading = timesheets.isLoading || expenses.isLoading
  const tabs: { key: 'all' | Kind; label: string }[] = [
    { key: 'all', label: `All (${items.length})` },
    { key: 'timesheet', label: 'Timesheets' },
    { key: 'expense', label: 'Expenses' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-sm text-muted-foreground">Everything waiting on you, in one place.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                filter === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => bulk('reject')} disabled={busy}>
              <X className="h-4 w-4" /> Reject
            </Button>
            <Button size="sm" onClick={() => bulk('approve')} disabled={busy}>
              <Check className="h-4 w-4" /> Approve
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : visible.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">You’re all caught up. 🎉</p>
          ) : (
            <ul className="divide-y">
              <li className="flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={selected.size === visible.length && visible.length > 0}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-input"
                />
                Select all
              </li>
              {visible.map((item) => (
                <li key={item.key} className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(item.key)}
                    onChange={() => toggle(item.key)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Badge variant={item.kind === 'timesheet' ? 'default' : 'warning'}>{item.kind}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <span className="text-sm font-medium">{item.amount}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label="Reject" onClick={() => single(item, 'reject')} disabled={busy}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Approve" onClick={() => single(item, 'approve')} disabled={busy}>
                      <Check className="h-4 w-4 text-emerald-600" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
