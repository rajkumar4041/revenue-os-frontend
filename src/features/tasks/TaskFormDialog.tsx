import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useCreateTask, useListProjects, useListUsers, useUpdateTask } from '@/gen/hooks'
import type { TaskResponse } from '@/gen/models/TaskResponse'
import type { CreateTaskRequest } from '@/gen/models/CreateTaskRequest'
import {
  createTaskRequestPriorityEnum,
  createTaskRequestStatusEnum,
} from '@/gen/models/CreateTaskRequest'
import { useAuth } from '@/store/auth'
import { getApiErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const schema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  assigneeUserId: z.string().optional(),
  priority: z.string(),
  status: z.string(),
  dueDate: z.string().optional(),
  estimatedHours: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: TaskResponse
  defaultProjectId?: string
}

export function TaskFormDialog({ open, onOpenChange, task, defaultProjectId }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!task
  const { hasPermission } = useAuth()

  const projectsQuery = useListProjects({ page: 0, size: 100 }, { query: { enabled: open } })
  // Assignee list needs USER_MANAGE; if the user lacks it, we just show no options.
  const usersQuery = useListUsers(
    { page: 0, size: 100 },
    { query: { enabled: open && hasPermission('USER_MANAGE') } },
  )
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const pending = createTask.isPending || updateTask.isPending
  const isError = createTask.isError || updateTask.isError
  const error = createTask.error ?? updateTask.error

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    reset({
      projectId: task?.projectId ?? defaultProjectId ?? '',
      title: task?.title ?? '',
      description: task?.description ?? '',
      assigneeUserId: task?.assigneeUserId ?? '',
      priority: task?.priority ?? 'MEDIUM',
      status: task?.status ?? 'TODO',
      dueDate: task?.dueDate ?? '',
      estimatedHours: task?.estimatedHours != null ? String(task.estimatedHours) : '',
    })
  }, [open, task, defaultProjectId, reset])

  const close = () => {
    createTask.reset()
    updateTask.reset()
    onOpenChange(false)
  }

  const onSubmit = (values: FormValues) => {
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/tasks' }] })
      close()
    }
    const shared = {
      title: values.title,
      description: values.description || undefined,
      assigneeUserId: values.assigneeUserId || undefined,
      priority: values.priority as CreateTaskRequest['priority'],
      status: values.status as CreateTaskRequest['status'],
      dueDate: values.dueDate || undefined,
      estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : undefined,
    }

    if (isEdit && task?.id) {
      updateTask.mutate({ id: task.id, data: shared }, { onSuccess })
    } else {
      createTask.mutate({ data: { ...shared, projectId: values.projectId } }, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit task' : 'New task'}</DialogTitle>
        <DialogDescription>Track a unit of work on a project.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Project" error={errors.projectId?.message}>
          <Select disabled={isEdit} {...register('projectId')}>
            <option value="">— Select a project —</option>
            {projectsQuery.data?.content?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Title" error={errors.title?.message}>
          <Input {...register('title')} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Assignee">
            <Select {...register('assigneeUserId')}>
              <option value="">— Unassigned —</option>
              {usersQuery.data?.content?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select {...register('priority')}>
              {Object.values(createTaskRequestPriorityEnum).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select {...register('status')}>
              {Object.values(createTaskRequestStatusEnum).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date">
            <Input type="date" {...register('dueDate')} />
          </Field>
          <Field label="Estimated hours">
            <Input type="number" step="0.5" {...register('estimatedHours')} />
          </Field>
        </div>

        <Field label="Description">
          <Textarea {...register('description')} />
        </Field>

        {isError && <p className="text-sm text-destructive">{getApiErrorMessage(error)}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
