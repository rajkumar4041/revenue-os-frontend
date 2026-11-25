import { useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, X } from 'lucide-react'
import { useApproveTimesheet, usePendingTimesheets, useRejectTimesheet } from '@/gen/hooks'
import type { TimesheetResponse } from '@/gen/models/TimesheetResponse'
import { useAuth } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ApprovalsPage() {
  const { hasPermission } = useAuth()
  const canApprove = hasPermission('TIMESHEET_APPROVE')
  const queryClient = useQueryClient()

  const pending = usePendingTimesheets({ query: { enabled: canApprove } })
  const approve = useApproveTimesheet()
  const reject = useRejectTimesheet()

  const refresh = () => queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/timesheets/pending' }] })

  if (!canApprove) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to approve timesheets.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const rows = pending.data ?? []

  const onReject = (timesheet: TimesheetResponse) => {
    if (!timesheet.id) return
    const note = window.prompt('Reason for rejection?') ?? ''
    reject.mutate({ id: timesheet.id, data: { note } }, { onSuccess: refresh })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Timesheet approvals</h1>
        <p className="text-sm text-muted-foreground">Review and approve submitted timesheets.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {pending.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">Nothing awaiting approval.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Total hours</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell className="font-medium">
                      {timesheet.periodStart} – {timesheet.periodEnd}
                    </TableCell>
                    <TableCell>{Number(timesheet.totalHours ?? 0)} h</TableCell>
                    <TableCell className="text-muted-foreground">{Number(timesheet.billableHours ?? 0)} h</TableCell>
                    <TableCell className="text-muted-foreground">
                      {timesheet.submittedAt ? new Date(timesheet.submittedAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReject(timesheet)}
                          disabled={reject.isPending}
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            timesheet.id && approve.mutate({ id: timesheet.id }, { onSuccess: refresh })
                          }
                          disabled={approve.isPending}
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
