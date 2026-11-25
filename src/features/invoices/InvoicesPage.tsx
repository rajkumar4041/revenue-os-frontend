import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { useListClients, useListInvoices } from '@/gen/hooks'
import type { InvoiceResponse, InvoiceResponseStatusEnum } from '@/gen/models/InvoiceResponse'
import { listInvoicesQueryParamsStatusEnum } from '@/gen/models/ListInvoices'
import type { ListInvoicesQueryParamsStatusEnum } from '@/gen/models/ListInvoices'
import { useAuth } from '@/store/auth'
import { Badge, type BadgeProps } from '@/components/ui/badge'
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
import { InvoiceFormDialog } from './InvoiceFormDialog'
import { InvoiceDetailDialog } from './InvoiceDetailDialog'

const STATUS_VARIANT: Record<InvoiceResponseStatusEnum, BadgeProps['variant']> = {
  DRAFT: 'muted',
  SENT: 'warning',
  PARTIALLY_PAID: 'default',
  PAID: 'success',
  VOID: 'destructive',
}

export default function InvoicesPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('INVOICE_VIEW')
  const canCreate = hasPermission('INVOICE_CREATE')

  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string>()

  const { data, isLoading, isError } = useListInvoices(
    {
      page: 0,
      size: 50,
      status: (statusFilter || undefined) as ListInvoicesQueryParamsStatusEnum | undefined,
    },
    { query: { enabled: canView } },
  )
  const clientsQuery = useListClients({ page: 0, size: 100 }, { query: { enabled: canView } })

  if (!canView) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to view invoices.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const invoices = data?.content ?? []
  const clientName = (id?: string) => clientsQuery.data?.content?.find((c) => c.id === id)?.name ?? '—'
  const money = (n?: number, currency?: string) =>
    (n ?? 0).toLocaleString(undefined, { style: 'currency', currency: currency || 'USD' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Bill clients and track collection.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New invoice
          </Button>
        )}
      </div>

      <InvoiceFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <InvoiceDetailDialog
        invoiceId={detailId}
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(undefined)}
      />

      <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
        <option value="">All statuses</option>
        {Object.values(listInvoicesQueryParamsStatusEnum).map((s) => (
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
            <p className="px-4 py-16 text-center text-sm text-destructive">Could not load invoices.</p>
          ) : invoices.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: InvoiceResponse) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer"
                    onClick={() => setDetailId(invoice.id)}
                  >
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{clientName(invoice.clientId)}</TableCell>
                    <TableCell className="text-muted-foreground">{invoice.issueDate}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status ? STATUS_VARIANT[invoice.status] : 'muted'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{money(invoice.total, invoice.currency)}</TableCell>
                    <TableCell className="text-muted-foreground">{money(invoice.balance, invoice.currency)}</TableCell>
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
