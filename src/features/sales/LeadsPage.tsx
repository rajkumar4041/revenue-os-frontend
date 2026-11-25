import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRightCircle, Loader2, Plus, Trash2 } from 'lucide-react'
import { useConvertLead, useCreateLead, useDeleteLead, useListLeads } from '@/gen/hooks'
import type { LeadResponse, LeadResponseStatusEnum } from '@/gen/models/LeadResponse'
import { listLeadsQueryParamsStatusEnum } from '@/gen/models/ListLeads'
import type { ListLeadsQueryParamsStatusEnum } from '@/gen/models/ListLeads'
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

const STATUS_VARIANT: Record<LeadResponseStatusEnum, BadgeProps['variant']> = {
  NEW: 'default',
  CONTACTED: 'warning',
  QUALIFIED: 'success',
  CONVERTED: 'muted',
  LOST: 'destructive',
}

export default function LeadsPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('CLIENT_VIEW')
  const canManage = hasPermission('CLIENT_CREATE')
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', source: '', estimatedValue: '' })

  const { data, isLoading, isError } = useListLeads(
    { page: 0, size: 50, status: (statusFilter || undefined) as ListLeadsQueryParamsStatusEnum | undefined },
    { query: { enabled: canView } },
  )
  const createLead = useCreateLead()
  const convertLead = useConvertLead()
  const deleteLead = useDeleteLead()

  const refreshLeads = () => queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/leads' }] })

  if (!canView) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to view leads.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const leads = data?.content ?? []
  const money = (n?: number) => (n == null ? '—' : n.toLocaleString(undefined, { style: 'currency', currency: 'USD' }))

  const save = () => {
    if (!form.name) return
    createLead.mutate(
      {
        data: {
          name: form.name,
          company: form.company || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          source: form.source || undefined,
          estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
        },
      },
      {
        onSuccess: () => {
          setOpen(false)
          setForm({ name: '', company: '', email: '', phone: '', source: '', estimatedValue: '' })
          refreshLeads()
        },
      },
    )
  }

  const convert = (lead: LeadResponse) => {
    if (!lead.id) return
    convertLead.mutate(
      { id: lead.id },
      {
        onSuccess: () => {
          refreshLeads()
          queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/opportunities' }] })
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Prospects at the top of the funnel.</p>
        </div>
        {canManage && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New lead
          </Button>
        )}
      </div>

      <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
        <option value="">All statuses</option>
        {Object.values(listLeadsQueryParamsStatusEnum).map((s) => (
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
            <p className="px-4 py-16 text-center text-sm text-destructive">Could not load leads.</p>
          ) : leads.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">No leads yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Est. value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.company || '—'}</TableCell>
                    <TableCell>{money(lead.estimatedValue)}</TableCell>
                    <TableCell>
                      <Badge variant={lead.status ? STATUS_VARIANT[lead.status] : 'muted'}>{lead.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <div className="flex justify-end gap-1">
                          {lead.status !== 'CONVERTED' && (
                            <Button variant="ghost" size="sm" onClick={() => convert(lead)} disabled={convertLead.isPending}>
                              <ArrowRightCircle className="h-4 w-4" />
                              Convert
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" aria-label="Delete"
                            onClick={() => lead.id && window.confirm('Delete lead?') && deleteLead.mutate({ id: lead.id }, { onSuccess: refreshLeads })}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>New lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Company"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Source"><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></Field>
            <Field label="Est. value"><Input type="number" step="0.01" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.name || createLead.isPending}>
              {createLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create lead
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  )
}
