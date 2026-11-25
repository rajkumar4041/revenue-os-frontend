import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { useListUsers } from '@/gen/hooks'
import type { UserResponse, UserResponseStatusEnum } from '@/gen/models/UserResponse'
import { useAuth } from '@/store/auth'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreateUserDialog } from './CreateUserDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const STATUS_VARIANT: Record<UserResponseStatusEnum, BadgeProps['variant']> = {
  ACTIVE: 'success',
  INVITED: 'warning',
  DISABLED: 'muted',
}

export default function UsersPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('USER_MANAGE')
  const [createOpen, setCreateOpen] = useState(false)

  // Generated TanStack Query hook — fetches /api/v1/users through our axios client.
  const { data, isLoading, isError } = useListUsers(
    { page: 0, size: 50 },
    { query: { enabled: canManage } },
  )

  if (!canManage) {
    return <AccessDenied />
  }

  const users = data?.content ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Everyone in your organization.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New user
        </Button>
      </div>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="px-4 py-16 text-center text-sm text-destructive">
              Could not load users. Please try again.
            </p>
          ) : users.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: UserResponse) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.status ? STATUS_VARIANT[user.status] : 'muted'}>
                        {user.status ?? 'UNKNOWN'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.roles?.map((role) => role.name).join(', ') || '—'}
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

function AccessDenied() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">No access</CardTitle>
        <CardDescription>You don’t have permission to manage users.</CardDescription>
      </CardHeader>
    </Card>
  )
}
