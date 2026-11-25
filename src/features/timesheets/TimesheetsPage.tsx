import { useEffect, useRef, useState } from 'react'
import { Loader2, Plus, Send, Trash2 } from 'lucide-react'
import {
  useAddTimeEntry,
  useDeleteTimeEntry,
  useListProjects,
  useOpenCurrentTimesheet,
  useSubmitTimesheet,
} from '@/gen/hooks'
import type { TimesheetDetailResponse } from '@/gen/models/TimesheetDetailResponse'
import type { TimesheetResponseStatusEnum } from '@/gen/models/TimesheetResponse'
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
import { TimerWidget } from './TimerWidget'

const STATUS_VARIANT: Record<TimesheetResponseStatusEnum, BadgeProps['variant']> = {
  DRAFT: 'muted',
  SUBMITTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
}

const today = () => new Date().toISOString().slice(0, 10)

export default function TimesheetsPage() {
  const { hasPermission } = useAuth()
  const canUse = hasPermission('TIMESHEET_SUBMIT')

  const openCurrent = useOpenCurrentTimesheet()
  const addEntry = useAddTimeEntry()
  const deleteEntry = useDeleteTimeEntry()
  const submit = useSubmitTimesheet()
  const projectsQuery = useListProjects({ page: 0, size: 100 }, { query: { enabled: canUse } })

  const [detail, setDetail] = useState<TimesheetDetailResponse>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ projectId: '', workDate: today(), hours: '', billable: true, description: '' })
  const loaded = useRef(false)

  const refresh = () => openCurrent.mutate(undefined, { onSuccess: setDetail })

  useEffect(() => {
    if (loaded.current || !canUse) return
    loaded.current = true
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse])

  if (!canUse) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to log time.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const timesheet = detail?.timesheet
  const entries = detail?.entries ?? []
  const editable = timesheet?.status === 'DRAFT' || timesheet?.status === 'REJECTED'
  const projectName = (id?: string) =>
    projectsQuery.data?.content?.find((p) => p.id === id)?.name ?? '—'

  const saveEntry = () => {
    if (!timesheet?.id || !form.projectId || !form.hours) return
    addEntry.mutate(
      {
        id: timesheet.id,
        data: {
          projectId: form.projectId,
          workDate: form.workDate,
          hours: Number(form.hours),
          billable: form.billable,
          description: form.description || undefined,
        },
      },
      {
        onSuccess: () => {
          setDialogOpen(false)
          setForm({ projectId: '', workDate: today(), hours: '', billable: true, description: '' })
          refresh()
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My timesheet</h1>
          <p className="text-sm text-muted-foreground">
            {timesheet ? `Week of ${timesheet.periodStart} – ${timesheet.periodEnd}` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {timesheet && <Badge variant={STATUS_VARIANT[timesheet.status!]}>{timesheet.status}</Badge>}
          {editable && (
            <Button
              variant="outline"
              onClick={() => timesheet?.id && submit.mutate({ id: timesheet.id }, { onSuccess: refresh })}
              disabled={submit.isPending || entries.length === 0}
            >
              <Send className="h-4 w-4" />
              Submit
            </Button>
          )}
        </div>
      </div>

      <TimerWidget onChange={refresh} />

      {timesheet?.status === 'REJECTED' && timesheet.reviewNote && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Rejected: {timesheet.reviewNote}
        </p>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Entries</CardTitle>
            <CardDescription>
              {Number(timesheet?.totalHours ?? 0)} h total · {Number(timesheet?.billableHours ?? 0)} h billable
            </CardDescription>
          </div>
          {editable && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add entry
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {openCurrent.isPending && !detail ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              No entries yet. Start the timer or add one manually.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">{entry.workDate}</TableCell>
                    <TableCell className="font-medium">{projectName(entry.projectId)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.description || '—'}
                      {entry.running && <Badge className="ml-2" variant="warning">running</Badge>}
                    </TableCell>
                    <TableCell>{Number(entry.hours ?? 0)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.billable ? 'default' : 'muted'}>
                        {entry.billable ? 'Billable' : 'Internal'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {editable && !entry.running && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete entry"
                          onClick={() =>
                            entry.id &&
                            deleteEntry.mutate({ entryId: entry.id }, { onSuccess: refresh })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Add time entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Project">
            <Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
              <option value="">Select project…</option>
              {projectsQuery.data?.content?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              <Input type="date" value={form.workDate} onChange={(e) => setForm({ ...form, workDate: e.target.value })} />
            </Field>
            <Field label="Hours">
              <Input type="number" step="0.25" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.billable}
              onChange={(e) => setForm({ ...form, billable: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            Billable
          </label>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEntry} disabled={!form.projectId || !form.hours || addEntry.isPending}>
              {addEntry.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  )
}
