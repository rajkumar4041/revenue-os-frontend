import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useCreateUser, useListRoles } from '@/gen/hooks'
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
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleIds: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof schema>

export function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient()
  const rolesQuery = useListRoles({ query: { enabled: open } })
  const createUser = useCreateUser()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { roleIds: [] } })

  const close = () => {
    reset()
    createUser.reset()
    onOpenChange(false)
  }

  const onSubmit = (values: FormValues) => {
    createUser.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/users' }] })
          close()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogHeader>
        <DialogTitle>New user</DialogTitle>
        <DialogDescription>Invite someone to your organization.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Temporary password</Label>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Roles</Label>
          <div className="space-y-2 rounded-md border p-3">
            {rolesQuery.data?.length ? (
              rolesQuery.data.map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={role.id}
                    {...register('roleIds')}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span>{role.name}</span>
                </label>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No roles available.</p>
            )}
          </div>
        </div>

        {createUser.isError && (
          <p className="text-sm text-destructive">{getApiErrorMessage(createUser.error)}</p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={createUser.isPending}>
            {createUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create user
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
