import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { useListTasks, useUpdateTaskStatus } from '@/gen/hooks'
import type { TaskResponse } from '@/gen/models/TaskResponse'
import type { ListTasksQueryParamsStatusEnum } from '@/gen/models/ListTasks'
import type { UpdateTaskStatusRequest } from '@/gen/models/UpdateTaskStatusRequest'
import { createTaskRequestStatusEnum } from '@/gen/models/CreateTaskRequest'
import { useAuth } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TaskFormDialog } from './TaskFormDialog'

export default function TasksPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('TASK_VIEW')
  const canCreate = hasPermission('TASK_CREATE')
  const canUpdate = hasPermission('TASK_UPDATE')
  const queryClient = useQueryClient()

  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('projectId') ?? undefined

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TaskResponse | undefined>()

  const { data, isLoading, isError } = useListTasks(
    {
      projectId,
      status: (statusFilter || undefined) as ListTasksQueryParamsStatusEnum | undefined,
    },
    { query: { enabled: canView } },
  )
  const updateStatus = useUpdateTaskStatus()

  if (!canView) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to view tasks.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const tasks = data ?? []

  const changeStatus = (task: TaskResponse, status: string) => {
    if (!task.id) return
    updateStatus.mutate(
      { id: task.id, data: { status: status as UpdateTaskStatusRequest['status'] } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/tasks' }] }) },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {projectId ? 'Tasks for the selected project.' : 'Work across your projects.'}
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            New task
          </Button>
        )}
      </div>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        defaultProjectId={projectId}
      />

      <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
        <option value="">All statuses</option>
        {Object.values(createTaskRequestStatusEnum).map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </Select>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="px-4 py-16 text-center text-sm text-destructive">Could not load tasks.</p>
          ) : tasks.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">No tasks found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="text-muted-foreground">{task.priority}</TableCell>
                    <TableCell className="text-muted-foreground">{task.dueDate ?? '—'}</TableCell>
                    <TableCell>
                      <Select
                        value={task.status}
                        disabled={!canUpdate || updateStatus.isPending}
                        onChange={(e) => changeStatus(task, e.target.value)}
                        className="h-8 w-36"
                      >
                        {Object.values(createTaskRequestStatusEnum).map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(task)
                            setDialogOpen(true)
                          }}
                        >
                          Edit
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
    </div>
  )
}
