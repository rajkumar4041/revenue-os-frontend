import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Plus, Trash2, X } from 'lucide-react'
import {
  useApproveExpense,
  useCreateExpense,
  useDeleteExpense,
  useListExpenses,
  useListProjects,
  useRejectExpense,
} from '@/gen/hooks'
import type { ExpenseResponse, ExpenseResponseStatusEnum } from '@/gen/models/ExpenseResponse'
import { createExpenseRequestCategoryEnum } from '@/gen/models/CreateExpenseRequest'
import { listExpensesQueryParamsStatusEnum } from '@/gen/models/ListExpenses'
import type { ListExpensesQueryParamsStatusEnum } from '@/gen/models/ListExpenses'
import { useAuth } from '@/store/auth'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field } from '@/components/ui/field'
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const STATUS_VARIANT: Record<ExpenseResponseStatusEnum, BadgeProps['variant']> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
}

const today = () => new Date().toISOString().slice(0, 10)

export default function ExpensesPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('REVENUE_VIEW')
  const canManage = hasPermission('REVENUE_MANAGE')
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ projectId: '', category: 'OTHER', amount: '', incurredOn: today(), description: '' })

  const { data, isLoading, isError } = useListExpenses(
    { page: 0, size: 50, status: (statusFilter || undefined) as ListExpensesQueryParamsStatusEnum | undefined },
    { query: { enabled: canView } },
  )
  const projectsQuery = useListProjects({ page: 0, size: 100 }, { query: { enabled: canView } })
  const createExpense = useCreateExpense()
  const approve = useApproveExpense()
  const reject = useRejectExpense()
  const remove = useDeleteExpense()

  const refresh = () => queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/expenses' }] })

  if (!canView) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to view expenses.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const expenses = data?.content ?? []
  const projectName = (id?: string) => projectsQuery.data?.content?.find((p) => p.id === id)?.name ?? '—'
  const money = (n?: number) => (n ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })

  const save = () => {
    if (!form.amount) return
    createExpense.mutate(
      {
        data: {
          projectId: form.projectId || undefined,
          category: form.category as typeof createExpenseRequestCategoryEnum[keyof typeof createExpenseRequestCategoryEnum],
          amount: Number(form.amount),
          incurredOn: form.incurredOn,
          description: form.description || undefined,
        },
      },
      {
        onSuccess: () => {
          setOpen(false)
          setForm({ projectId: '', category: 'OTHER', amount: '', incurredOn: today(), description: '' })
          refresh()
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">Project costs and overheads.</p>
        </div>
        {canManage && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Record expense
          </Button>
        )}
      </div>

      <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
        <option value="">All statuses</option>
        {Object.values(listExpensesQueryParamsStatusEnum).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </Select>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="px-4 py-16 text-center text-sm text-destructive">Could not load expenses.</p>
          ) : expenses.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">No expenses yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense: ExpenseResponse) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-muted-foreground">{expense.incurredOn}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell className="text-muted-foreground">{projectName(expense.projectId)}</TableCell>
                    <TableCell>{money(expense.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={expense.status ? STATUS_VARIANT[expense.status] : 'muted'}>
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <div className="flex justify-end gap-1">
                          {expense.status === 'PENDING' && (
                            <>
                              <Button variant="ghost" size="icon" aria-label="Approve"
                                onClick={() => expense.id && approve.mutate({ id: expense.id }, { onSuccess: refresh })}>
                                <Check className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button variant="ghost" size="icon" aria-label="Reject"
                                onClick={() => expense.id && reject.mutate({ id: expense.id }, { onSuccess: refresh })}>
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" aria-label="Delete"
                            onClick={() => expense.id && window.confirm('Delete this expense?') && remove.mutate({ id: expense.id }, { onSuccess: refresh })}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Record expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.values(createExpenseRequestCategoryEnum).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Project">
              <Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                <option value="">— None —</option>
                {projectsQuery.data?.content?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Amount">
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label="Date">
              <Input type="date" value={form.incurredOn} onChange={(e) => setForm({ ...form, incurredOn: e.target.value })} />
            </Field>
          </div>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.amount || createExpense.isPending}>
              {createExpense.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Record
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  )
}
