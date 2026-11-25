import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useListDepartments, useOnboardEmployee, useUpdateEmployee } from '@/gen/hooks'
import type { EmployeeResponse } from '@/gen/models/EmployeeResponse'
import type { OnboardEmployeeRequest } from '@/gen/models/OnboardEmployeeRequest'
import type { UpdateEmployeeRequest } from '@/gen/models/UpdateEmployeeRequest'
import { onboardEmployeeRequestEmploymentTypeEnum } from '@/gen/models/OnboardEmployeeRequest'
import { updateEmployeeRequestEmploymentStatusEnum } from '@/gen/models/UpdateEmployeeRequest'
import { getApiErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field } from '@/components/ui/field'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const schema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  employmentType: z.string(),
  employmentStatus: z.string().optional(),
  costRate: z.string().optional(),
  billableRate: z.string().optional(),
  hireDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: EmployeeResponse
}

export function EmployeeFormDialog({ open, onOpenChange, employee }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!employee
  const departmentsQuery = useListDepartments({ query: { enabled: open } })
  const onboard = useOnboardEmployee()
  const update = useUpdateEmployee()
  const pending = onboard.isPending || update.isPending
  const isError = onboard.isError || update.isError
  const error = onboard.error ?? update.error

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    reset({
      fullName: employee?.fullName ?? '',
      email: employee?.email ?? '',
      departmentId: employee?.departmentId ?? '',
      designation: employee?.designation ?? '',
      employmentType: employee?.employmentType ?? 'FULL_TIME',
      employmentStatus: employee?.employmentStatus ?? 'ONBOARDING',
      costRate: employee?.costRate != null ? String(employee.costRate) : '',
      billableRate: employee?.billableRate != null ? String(employee.billableRate) : '',
      hireDate: employee?.hireDate ?? '',
    })
  }, [open, employee, reset])

  const close = () => {
    onboard.reset()
    update.reset()
    onOpenChange(false)
  }

  const onSubmit = (values: FormValues) => {
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/employees' }] })
      close()
    }
    const shared = {
      fullName: values.fullName,
      email: values.email,
      departmentId: values.departmentId || undefined,
      designation: values.designation || undefined,
      employmentType: values.employmentType as OnboardEmployeeRequest['employmentType'],
      costRate: values.costRate ? Number(values.costRate) : undefined,
      billableRate: values.billableRate ? Number(values.billableRate) : undefined,
      hireDate: values.hireDate || undefined,
    }

    if (isEdit && employee?.id) {
      const data: UpdateEmployeeRequest = {
        ...shared,
        employmentStatus: values.employmentStatus as UpdateEmployeeRequest['employmentStatus'],
      }
      update.mutate({ id: employee.id, data }, { onSuccess })
    } else {
      onboard.mutate({ data: shared }, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit employee' : 'Onboard employee'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Update this person’s details.' : 'Add a new hire to your organization.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.fullName?.message}>
            <Input {...register('fullName')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </Field>
          <Field label="Department">
            <Select {...register('departmentId')}>
              <option value="">— None —</option>
              {departmentsQuery.data?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Designation">
            <Input {...register('designation')} />
          </Field>
          <Field label="Employment type">
            <Select {...register('employmentType')}>
              {Object.values(onboardEmployeeRequestEmploymentTypeEnum).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          {isEdit && (
            <Field label="Status">
              <Select {...register('employmentStatus')}>
                {Object.values(updateEmployeeRequestEmploymentStatusEnum).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Cost rate / hr">
            <Input type="number" step="0.01" {...register('costRate')} />
          </Field>
          <Field label="Billable rate / hr">
            <Input type="number" step="0.01" {...register('billableRate')} />
          </Field>
          <Field label="Hire date">
            <Input type="date" {...register('hireDate')} />
          </Field>
        </div>

        {isError && <p className="text-sm text-destructive">{getApiErrorMessage(error)}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Onboard'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
