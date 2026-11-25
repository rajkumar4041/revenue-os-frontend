import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useCreateRole, useListPermissions, useUpdateRole } from '@/gen/hooks'
import type { RoleResponse } from '@/gen/models/RoleResponse'
import type { PermissionResponse } from '@/gen/models/PermissionResponse'
import { getApiErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const schema = z.object({
  name: z.string().min(1, 'Role name is required').max(64),
  description: z.string().max(255).optional(),
  permissionCodes: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: RoleResponse
}

export function RoleFormDialog({ open, onOpenChange, role }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!role
  const permissionsQuery = useListPermissions({ query: { enabled: open } })
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const pending = createRole.isPending || updateRole.isPending
  const error = createRole.error ?? updateRole.error
  const isError = createRole.isError || updateRole.isError

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { permissionCodes: [] } })

  // Reset the form whenever the dialog opens (fresh for create, prefilled for edit).
  useEffect(() => {
    if (!open) return
    reset({
      name: role?.name ?? '',
      description: role?.description ?? '',
      permissionCodes: role?.permissions?.map((p) => p.code).filter(Boolean) as string[] | undefined,
    })
  }, [open, role, reset])

  const grouped = useMemo(() => groupByCategory(permissionsQuery.data ?? []), [permissionsQuery.data])

  const close = () => {
    createRole.reset()
    updateRole.reset()
    onOpenChange(false)
  }

  const onSubmit = (values: FormValues) => {
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/roles' }] })
      close()
    }
    if (isEdit && role?.id) {
      updateRole.mutate(
        { id: role.id, data: { description: values.description, permissionCodes: values.permissionCodes } },
        { onSuccess },
      )
    } else {
      createRole.mutate({ data: values }, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit role' : 'New role'}</DialogTitle>
        <DialogDescription>Choose which permissions this role grants.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="role-name">Name</Label>
          <Input id="role-name" disabled={isEdit} {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role-description">Description</Label>
          <Input id="role-description" {...register('description')} />
        </div>

        <div className="space-y-2">
          <Label>Permissions</Label>
          <div className="space-y-4 rounded-md border p-3">
            {Object.entries(grouped).map(([category, perms]) => (
              <div key={category} className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {category}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {perms.map((permission) => (
                    <label key={permission.code} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        value={permission.code}
                        {...register('permissionCodes')}
                        className="h-4 w-4 rounded border-input"
                      />
                      <span>{permission.code}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isError && <p className="text-sm text-destructive">{getApiErrorMessage(error)}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create role'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

function groupByCategory(permissions: PermissionResponse[]): Record<string, PermissionResponse[]> {
  return permissions.reduce<Record<string, PermissionResponse[]>>((acc, permission) => {
    const key = permission.category ?? 'Other'
    ;(acc[key] ??= []).push(permission)
    return acc
  }, {})
}
