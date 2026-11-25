import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useCreateInvoice, useListClients } from '@/gen/hooks'
import type { CreateInvoiceRequest } from '@/gen/models/CreateInvoiceRequest'
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

const today = () => new Date().toISOString().slice(0, 10)

interface FormValues {
  clientId: string
  issueDate: string
  dueDate: string
  currency: string
  taxAmount: string
  notes: string
  items: { description: string; quantity: string; unitPrice: string }[]
}

const EMPTY: FormValues = {
  clientId: '',
  issueDate: today(),
  dueDate: '',
  currency: 'USD',
  taxAmount: '',
  notes: '',
  items: [{ description: '', quantity: '1', unitPrice: '' }],
}

export function InvoiceFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient()
  const clientsQuery = useListClients({ page: 0, size: 100 }, { query: { enabled: open } })
  const createInvoice = useCreateInvoice()

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: EMPTY,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  const items = watch('items')
  const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)
  const total = subtotal + (Number(watch('taxAmount')) || 0)

  const close = () => {
    createInvoice.reset()
    onOpenChange(false)
  }

  const onSubmit = (values: FormValues) => {
    const data: CreateInvoiceRequest = {
      clientId: values.clientId,
      issueDate: values.issueDate,
      dueDate: values.dueDate || undefined,
      currency: values.currency || 'USD',
      taxAmount: values.taxAmount ? Number(values.taxAmount) : undefined,
      notes: values.notes || undefined,
      items: values.items.map((i) => ({
        description: i.description,
        quantity: Number(i.quantity) || 0,
        unitPrice: Number(i.unitPrice) || 0,
      })),
    }
    createInvoice.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/invoices' }] })
          close()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogHeader>
        <DialogTitle>New invoice</DialogTitle>
        <DialogDescription>Draft an invoice with line items.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Client" error={errors.clientId?.message}>
            <Select {...register('clientId', { required: 'Client is required' })}>
              <option value="">Select client…</option>
              {clientsQuery.data?.content?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Currency">
            <Input {...register('currency')} />
          </Field>
          <Field label="Issue date">
            <Input type="date" {...register('issueDate')} />
          </Field>
          <Field label="Due date">
            <Input type="date" {...register('dueDate')} />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Line items</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: '', quantity: '1', unitPrice: '' })}
            >
              <Plus className="h-4 w-4" />
              Add line
            </Button>
          </div>
          {fields.map((field, i) => (
            <div key={field.id} className="flex gap-2">
              <Input className="flex-1" placeholder="Description" {...register(`items.${i}.description`)} />
              <Input className="w-20" type="number" step="0.5" placeholder="Qty" {...register(`items.${i}.quantity`)} />
              <Input className="w-28" type="number" step="0.01" placeholder="Unit price" {...register(`items.${i}.unitPrice`)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Remove line">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tax amount">
            <Input type="number" step="0.01" {...register('taxAmount')} />
          </Field>
          <div className="flex flex-col justify-end text-right text-sm">
            <span className="text-muted-foreground">Subtotal {subtotal.toFixed(2)}</span>
            <span className="text-lg font-semibold">Total {total.toFixed(2)}</span>
          </div>
        </div>

        <Field label="Notes">
          <Input {...register('notes')} />
        </Field>

        {createInvoice.isError && (
          <p className="text-sm text-destructive">{getApiErrorMessage(createInvoice.error)}</p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={createInvoice.isPending}>
            {createInvoice.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create invoice
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
