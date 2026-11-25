import { useEffect, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useCreateClient, useUpdateClient } from '@/gen/hooks'
import type { ClientResponse } from '@/gen/models/ClientResponse'
import type { CreateClientRequest } from '@/gen/models/CreateClientRequest'
import {
  createClientRequestClientTypeEnum,
  createClientRequestStatusEnum,
} from '@/gen/models/CreateClientRequest'
import { getApiErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  clientType: z.string(),
  status: z.string(),
  contractValue: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const EMPTY: FormValues = {
  name: '',
  companyName: '',
  industry: '',
  email: '',
  phone: '',
  country: '',
  website: '',
  clientType: 'DIRECT',
  status: 'PROSPECT',
  contractValue: '',
  notes: '',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: ClientResponse
}

export function ClientFormDialog({ open, onOpenChange, client }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!client
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const pending = createClient.isPending || updateClient.isPending
  const isError = createClient.isError || updateClient.isError
  const error = createClient.error ?? updateClient.error

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY })

  useEffect(() => {
    if (!open) return
    reset(
      client
        ? {
            name: client.name ?? '',
            companyName: client.companyName ?? '',
            industry: client.industry ?? '',
            email: client.email ?? '',
            phone: client.phone ?? '',
            country: client.country ?? '',
            website: client.website ?? '',
            clientType: client.clientType ?? 'DIRECT',
            status: client.status ?? 'PROSPECT',
            contractValue: client.contractValue != null ? String(client.contractValue) : '',
            notes: client.notes ?? '',
          }
        : EMPTY,
    )
  }, [open, client, reset])

  const close = () => {
    createClient.reset()
    updateClient.reset()
    onOpenChange(false)
  }

  const onSubmit = (values: FormValues) => {
    const data: CreateClientRequest = {
      name: values.name,
      companyName: values.companyName || undefined,
      industry: values.industry || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      country: values.country || undefined,
      website: values.website || undefined,
      clientType: values.clientType as CreateClientRequest['clientType'],
      status: values.status as CreateClientRequest['status'],
      contractValue: values.contractValue ? Number(values.contractValue) : undefined,
      notes: values.notes || undefined,
    }

    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/clients' }] })
      close()
    }

    if (isEdit && client?.id) {
      updateClient.mutate({ id: client.id, data }, { onSuccess })
    } else {
      createClient.mutate({ data }, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit client' : 'New client'}</DialogTitle>
        <DialogDescription>Capture the key details for this account.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" error={errors.name?.message}>
            <Input {...register('name')} />
          </Field>
          <Field label="Company">
            <Input {...register('companyName')} />
          </Field>
          <Field label="Industry">
            <Input {...register('industry')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </Field>
          <Field label="Phone">
            <Input {...register('phone')} />
          </Field>
          <Field label="Country">
            <Input {...register('country')} />
          </Field>
          <Field label="Type">
            <Select {...register('clientType')}>
              {Object.values(createClientRequestClientTypeEnum).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select {...register('status')}>
              {Object.values(createClientRequestStatusEnum).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Website">
            <Input {...register('website')} />
          </Field>
          <Field label="Contract value">
            <Input type="number" step="0.01" {...register('contractValue')} />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea {...register('notes')} />
        </Field>

        {isError && <p className="text-sm text-destructive">{getApiErrorMessage(error)}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create client'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
