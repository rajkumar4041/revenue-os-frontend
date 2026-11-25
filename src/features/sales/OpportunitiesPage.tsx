import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trophy } from 'lucide-react'
import {
  useCreateOpportunity,
  useListOpportunities,
  useUpdateOpportunityStage,
  useWinOpportunity,
} from '@/gen/hooks'
import type { OpportunityResponse } from '@/gen/models/OpportunityResponse'
import { opportunityResponseStageEnum } from '@/gen/models/OpportunityResponse'
import type { OpportunityStageRequest } from '@/gen/models/OpportunityStageRequest'
import { useAuth } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field } from '@/components/ui/field'
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const STAGES = Object.values(opportunityResponseStageEnum)

export default function OpportunitiesPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('CLIENT_VIEW')
  const canManage = hasPermission('CLIENT_CREATE')
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', value: '', expectedCloseDate: '' })

  const { data, isLoading, isError } = useListOpportunities({ query: { enabled: canView } })
  const createOpportunity = useCreateOpportunity()
  const updateStage = useUpdateOpportunityStage()
  const win = useWinOpportunity()

  const refresh = () => queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/opportunities' }] })

  if (!canView) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to view the pipeline.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const opportunities = data ?? []
  const byStage = (stage: string) => opportunities.filter((o) => o.stage === stage)
  const money = (n?: number) => (n == null ? '' : n.toLocaleString(undefined, { style: 'currency', currency: 'USD' }))

  const changeStage = (opp: OpportunityResponse, stage: string) => {
    if (!opp.id) return
    updateStage.mutate(
      { id: opp.id, data: { stage: stage as OpportunityStageRequest['stage'] } },
      { onSuccess: refresh },
    )
  }

  const save = () => {
    if (!form.name) return
    createOpportunity.mutate(
      {
        data: {
          name: form.name,
          value: form.value ? Number(form.value) : undefined,
          expectedCloseDate: form.expectedCloseDate || undefined,
        },
      },
      {
        onSuccess: () => {
          setOpen(false)
          setForm({ name: '', value: '', expectedCloseDate: '' })
          refresh()
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Opportunities by stage.</p>
        </div>
        {canManage && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New opportunity
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="py-16 text-center text-sm text-destructive">Could not load the pipeline.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {STAGES.map((stage) => (
            <div key={stage} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stage}</span>
                <span className="text-xs text-muted-foreground">{byStage(stage).length}</span>
              </div>
              <div className="space-y-2">
                {byStage(stage).map((opp) => (
                  <Card key={opp.id} className="p-3">
                    <p className="text-sm font-medium">{opp.name}</p>
                    {opp.value != null && <p className="text-xs text-muted-foreground">{money(opp.value)}</p>}
                    {canManage && (
                      <div className="mt-2 flex items-center gap-1">
                        <Select
                          value={opp.stage}
                          onChange={(e) => changeStage(opp, e.target.value)}
                          className="h-8 text-xs"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </Select>
                        {opp.stage !== 'WON' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Mark won"
                            onClick={() => opp.id && win.mutate({ id: opp.id }, { onSuccess: refresh })}
                          >
                            <Trophy className="h-4 w-4 text-emerald-600" />
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>New opportunity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Value"><Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field>
            <Field label="Expected close"><Input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.name || createOpportunity.isPending}>
              {createOpportunity.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  )
}
