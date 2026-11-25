import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useCreateProject, useListClients, useUpdateProject } from '@/gen/hooks'
import type { ProjectResponse } from '@/gen/models/ProjectResponse'
import type { CreateProjectRequest } from '@/gen/models/CreateProjectRequest'
import {
  createProjectRequestBillingTypeEnum,
  createProjectRequestPriorityEnum,
  createProjectRequestStatusEnum,
} from '@/gen/models/CreateProjectRequest'
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
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  clientId: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  billingType: z.string(),
  estimatedBudget: z.string().optional(),
  contractValue: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const EMPTY: FormValues = {
  name: '',
  code: '',
  clientId: '',
  status: 'PLANNING',
  priority: 'MEDIUM',
  billingType: 'FIXED',
  estimatedBudget: '',
  contractValue: '',
  startDate: '',
  endDate: '',
  description: '',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: ProjectResponse
}

export function ProjectFormDialog({ open, onOpenChange, project }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!project
  const clientsQuery = useListClients({ page: 0, size: 100 }, { query: { enabled: open } })
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const pending = createProject.isPending || updateProject.isPending
  const isError = createProject.isError || updateProject.isError
  const error = createProject.error ?? updateProject.error

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY })

  useEffect(() => {
    if (!open) return
    reset(
      project
        ? {
            name: project.name ?? '',
            code: project.code ?? '',
            clientId: project.clientId ?? '',
            status: project.status ?? 'PLANNING',
            priority: project.priority ?? 'MEDIUM',
            billingType: project.billingType ?? 'FIXED',
            estimatedBudget: project.estimatedBudget != null ? String(project.estimatedBudget) : '',
            contractValue: project.contractValue != null ? String(project.contractValue) : '',
            startDate: project.startDate ?? '',
            endDate: project.endDate ?? '',
            description: project.description ?? '',
          }
        : EMPTY,
    )
  }, [open, project, reset])

  const close = () => {
    createProject.reset()
    updateProject.reset()
    onOpenChange(false)
  }

  const onSubmit = (values: FormValues) => {
    const base = {
      name: values.name,
      clientId: values.clientId || undefined,
      status: values.status as CreateProjectRequest['status'],
      priority: values.priority as CreateProjectRequest['priority'],
      billingType: values.billingType as CreateProjectRequest['billingType'],
      estimatedBudget: values.estimatedBudget ? Number(values.estimatedBudget) : undefined,
      contractValue: values.contractValue ? Number(values.contractValue) : undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      description: values.description || undefined,
    }

    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/projects' }] })
      close()
    }

    if (isEdit && project?.id) {
      updateProject.mutate({ id: project.id, data: base }, { onSuccess })
    } else {
      createProject.mutate({ data: { ...base, code: values.code } }, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit project' : 'New project'}</DialogTitle>
        <DialogDescription>Set up the project and its commercial terms.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" error={errors.name?.message}>
            <Input {...register('name')} />
          </Field>
          <Field label="Code" error={errors.code?.message}>
            <Input disabled={isEdit} {...register('code')} />
          </Field>
          <Field label="Client">
            <Select {...register('clientId')}>
              <option value="">— None —</option>
              {clientsQuery.data?.content?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select {...register('status')}>
              {Object.values(createProjectRequestStatusEnum).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select {...register('priority')}>
              {Object.values(createProjectRequestPriorityEnum).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Billing type">
            <Select {...register('billingType')}>
              {Object.values(createProjectRequestBillingTypeEnum).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estimated budget">
            <Input type="number" step="0.01" {...register('estimatedBudget')} />
          </Field>
          <Field label="Contract value">
            <Input type="number" step="0.01" {...register('contractValue')} />
          </Field>
          <Field label="Start date">
            <Input type="date" {...register('startDate')} />
          </Field>
          <Field label="End date">
            <Input type="date" {...register('endDate')} />
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
            {isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
