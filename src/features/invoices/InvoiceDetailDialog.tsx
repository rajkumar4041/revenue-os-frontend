import { useState } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import {
  useGetInvoice,
  useRecordPayment,
  useSendInvoice,
  useVoidInvoice,
} from '@/gen/hooks'
import { recordPaymentRequestMethodEnum } from '@/gen/models/RecordPaymentRequest'
import { getApiErrorMessage } from '@/lib/errors'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field } from '@/components/ui/field'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  DRAFT: 'muted',
  SENT: 'warning',
  PARTIALLY_PAID: 'default',
  PAID: 'success',
  VOID: 'destructive',
}

const today = () => new Date().toISOString().slice(0, 10)

function invoicesPredicate(queryKey: QueryKey) {
  const first = queryKey?.[0] as { url?: string } | undefined
  return typeof first?.url === 'string' && first.url.includes('/api/v1/invoices')
}

export function InvoiceDetailDialog({
  invoiceId,
  open,
  onOpenChange,
}: {
  invoiceId?: string
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const queryClient = useQueryClient()
  const detail = useGetInvoice(invoiceId ?? '', { query: { enabled: open && !!invoiceId } })
  const send = useSendInvoice()
  const voidInvoice = useVoidInvoice()
  const recordPayment = useRecordPayment()

  const [payment, setPayment] = useState({ amount: '', paidOn: today(), method: 'BANK_TRANSFER', reference: '' })

  const refresh = () => queryClient.invalidateQueries({ predicate: (q) => invoicesPredicate(q.queryKey) })

  const invoice = detail.data?.invoice
  const items = detail.data?.items ?? []
  const payments = detail.data?.payments ?? []
  const money = (n?: number) =>
    (n ?? 0).toLocaleString(undefined, { style: 'currency', currency: invoice?.currency || 'USD' })

  const submitPayment = () => {
    if (!invoiceId || !payment.amount) return
    recordPayment.mutate(
      {
        id: invoiceId,
        data: {
          amount: Number(payment.amount),
          paidOn: payment.paidOn,
          method: payment.method as typeof recordPaymentRequestMethodEnum[keyof typeof recordPaymentRequestMethodEnum],
          reference: payment.reference || undefined,
        },
      },
      {
        onSuccess: () => {
          setPayment({ amount: '', paidOn: today(), method: 'BANK_TRANSFER', reference: '' })
          refresh()
        },
      },
    )
  }

  const canPay = invoice?.status === 'SENT' || invoice?.status === 'PARTIALLY_PAID'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>
          <span className="flex items-center gap-2">
            {invoice?.invoiceNumber ?? 'Invoice'}
            {invoice && <Badge variant={STATUS_VARIANT[invoice.status!]}>{invoice.status}</Badge>}
          </span>
        </DialogTitle>
      </DialogHeader>

      {detail.isLoading || !invoice ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold">{money(invoice.total)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid</p>
              <p className="font-semibold text-emerald-600">{money(invoice.amountPaid)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Balance</p>
              <p className="font-semibold">{money(invoice.balance)}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{Number(item.quantity)}</TableCell>
                  <TableCell>{money(item.unitPrice)}</TableCell>
                  <TableCell>{money(item.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {payments.length > 0 && (
            <div className="space-y-1 text-sm">
              <p className="font-medium">Payments</p>
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between text-muted-foreground">
                  <span>{p.paidOn} · {p.method}</span>
                  <span>{money(p.amount)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {invoice.status === 'DRAFT' && (
              <Button onClick={() => invoiceId && send.mutate({ id: invoiceId }, { onSuccess: refresh })}>
                Send
              </Button>
            )}
            {invoice.status !== 'PAID' && invoice.status !== 'VOID' && (
              <Button
                variant="outline"
                onClick={() => invoiceId && voidInvoice.mutate({ id: invoiceId }, { onSuccess: refresh })}
              >
                Void
              </Button>
            )}
          </div>

          {canPay && (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-medium">Record payment</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount">
                  <Input type="number" step="0.01" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} />
                </Field>
                <Field label="Date">
                  <Input type="date" value={payment.paidOn} onChange={(e) => setPayment({ ...payment, paidOn: e.target.value })} />
                </Field>
                <Field label="Method">
                  <Select value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}>
                    {Object.values(recordPaymentRequestMethodEnum).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Reference">
                  <Input value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} />
                </Field>
              </div>
              {recordPayment.isError && (
                <p className="text-sm text-destructive">{getApiErrorMessage(recordPayment.error)}</p>
              )}
              <Button onClick={submitPayment} disabled={!payment.amount || recordPayment.isPending}>
                {recordPayment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Record payment
              </Button>
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}
