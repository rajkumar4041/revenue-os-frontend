import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCreateTeam, useDeleteTeam, useListTeams, useListUsers, useUpdateTeam } from '@/gen/hooks'
import type { TeamResponse } from '@/gen/models/TeamResponse'
import { useAuth } from '@/store/auth'
import { getApiErrorMessage } from '@/lib/errors'
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

export default function TeamsPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('EMPLOYEE_VIEW')
  const canManage = hasPermission('EMPLOYEE_MANAGE')
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TeamResponse | undefined>()
  const [form, setForm] = useState({ name: '', managerUserId: '' })

  const teamsQuery = useListTeams({ query: { enabled: canView } })
  const usersQuery = useListUsers(
    { page: 0, size: 100 },
    { query: { enabled: dialogOpen && hasPermission('USER_MANAGE') } },
  )
  const createTeam = useCreateTeam()
  const updateTeam = useUpdateTeam()
  const deleteTeam = useDeleteTeam()
  const pending = createTeam.isPending || updateTeam.isPending
  const error = createTeam.error ?? updateTeam.error

  useEffect(() => {
    if (dialogOpen) setForm({ name: editing?.name ?? '', managerUserId: editing?.managerUserId ?? '' })
  }, [dialogOpen, editing])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/teams' }] })

  if (!canView) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to view teams.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const teams = teamsQuery.data ?? []
  const userName = (id?: string) => {
    if (!id) return '—'
    const u = usersQuery.data?.content?.find((x) => x.id === id)
    return u?.name ?? '—'
  }

  const save = () => {
    if (!form.name.trim()) return
    const data = { name: form.name, managerUserId: form.managerUserId || undefined }
    const onSuccess = () => {
      invalidate()
      setDialogOpen(false)
    }
    if (editing?.id) {
      updateTeam.mutate({ id: editing.id, data }, { onSuccess })
    } else {
      createTeam.mutate({ data }, { onSuccess })
    }
  }

  const remove = (team: TeamResponse) => {
    if (!team.id || !window.confirm(`Delete the “${team.name}” team?`)) return
    deleteTeam.mutate({ id: team.id }, { onSuccess: invalidate })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
          <p className="text-sm text-muted-foreground">Organize people into teams, each with a manager.</p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            New team
          </Button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit team' : 'New team'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </Field>
          <Field label="Manager">
            <Select value={form.managerUserId} onChange={(e) => setForm({ ...form, managerUserId: e.target.value })}>
              <option value="">— No manager —</option>
              {usersQuery.data?.content?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
          {error && <p className="text-sm text-destructive">{getApiErrorMessage(error)}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending || !form.name.trim()}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {teamsQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : teams.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">No teams yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {hasPermission('USER_MANAGE') ? userName(team.managerUserId) : team.managerUserId ? 'Assigned' : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(team)
                              setDialogOpen(true)
                            }}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(team)} aria-label="Delete">
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
    </div>
  )
}
