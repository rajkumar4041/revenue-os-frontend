import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  useCreateDepartment,
  useDeleteDepartment,
  useListDepartments,
  useUpdateDepartment,
} from '@/gen/hooks'
import type { DepartmentResponse } from '@/gen/models/DepartmentResponse'
import { useAuth } from '@/store/auth'
import { getApiErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function DepartmentsPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('EMPLOYEE_VIEW')
  const canManage = hasPermission('EMPLOYEE_MANAGE')
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DepartmentResponse | undefined>()
  const [name, setName] = useState('')

  const departmentsQuery = useListDepartments({ query: { enabled: canView } })
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const deleteDepartment = useDeleteDepartment()
  const pending = createDepartment.isPending || updateDepartment.isPending
  const error = createDepartment.error ?? updateDepartment.error

  useEffect(() => {
    if (dialogOpen) setName(editing?.name ?? '')
  }, [dialogOpen, editing])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/departments' }] })

  if (!canView) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to view departments.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const save = () => {
    if (!name.trim()) return
    const onSuccess = () => {
      invalidate()
      setDialogOpen(false)
    }
    if (editing?.id) {
      updateDepartment.mutate({ id: editing.id, data: { name } }, { onSuccess })
    } else {
      createDepartment.mutate({ data: { name } }, { onSuccess })
    }
  }

  const remove = (department: DepartmentResponse) => {
    if (!department.id || !window.confirm(`Delete “${department.name}”?`)) return
    deleteDepartment.mutate({ id: department.id }, { onSuccess: invalidate })
  }

  const departments = departmentsQuery.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
          <p className="text-sm text-muted-foreground">Organize your teams.</p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            New department
          </Button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit department' : 'New department'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          {error && <p className="text-sm text-destructive">{getApiErrorMessage(error)}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {departmentsQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : departments.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">No departments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(department)
                              setDialogOpen(true)
                            }}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(department)}
                            aria-label="Delete"
                          >
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
