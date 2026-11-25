import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useDeleteRole, useListRoles } from '@/gen/hooks'
import type { RoleResponse } from '@/gen/models/RoleResponse'
import { useAuth } from '@/store/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RoleFormDialog } from './RoleFormDialog'

export default function RolesPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('ROLE_MANAGE')
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleResponse | undefined>()

  const rolesQuery = useListRoles({ query: { enabled: canManage } })
  const deleteRole = useDeleteRole()

  if (!canManage) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to manage roles.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const openCreate = () => {
    setEditingRole(undefined)
    setDialogOpen(true)
  }

  const openEdit = (role: RoleResponse) => {
    setEditingRole(role)
    setDialogOpen(true)
  }

  const handleDelete = (role: RoleResponse) => {
    if (!role.id) return
    if (!window.confirm(`Delete the “${role.name}” role?`)) return
    deleteRole.mutate(
      { id: role.id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/roles' }] }) },
    )
  }

  const roles = rolesQuery.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles &amp; permissions</h1>
          <p className="text-sm text-muted-foreground">Control what each role can do.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New role
        </Button>
      </div>

      <RoleFormDialog open={dialogOpen} onOpenChange={setDialogOpen} role={editingRole} />

      {rolesQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rolesQuery.isError ? (
        <p className="py-16 text-center text-sm text-destructive">Could not load roles.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {role.name}
                      {role.system && <Badge variant="muted">system</Badge>}
                    </CardTitle>
                    {role.description && <CardDescription>{role.description}</CardDescription>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(role)} aria-label="Edit role">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!role.system && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(role)}
                        aria-label="Delete role"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {role.permissions?.length ? (
                  role.permissions.map((permission) => (
                    <Badge key={permission.code} variant="muted">
                      {permission.code}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No permissions</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
