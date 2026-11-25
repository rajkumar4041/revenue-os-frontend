import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Archive, Loader2, Pencil, Plus } from 'lucide-react'
import { useArchiveClient, useListClients } from '@/gen/hooks'
import type { ClientResponse, ClientResponseStatusEnum } from '@/gen/models/ClientResponse'
import { useAuth } from '@/store/auth'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ClientFormDialog } from './ClientFormDialog'

const STATUS_VARIANT: Record<ClientResponseStatusEnum, BadgeProps['variant']> = {
  ACTIVE: 'success',
  PROSPECT: 'default',
  INACTIVE: 'muted',
  ARCHIVED: 'muted',
}

export default function ClientsPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('CLIENT_VIEW')
  const canCreate = hasPermission('CLIENT_CREATE')
  const canUpdate = hasPermission('CLIENT_UPDATE')
  const canArchive = hasPermission('CLIENT_DELETE')
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ClientResponse | undefined>()

  const { data, isLoading, isError } = useListClients(
    { search: search || undefined, page: 0, size: 50 },
    { query: { enabled: canView } },
  )
  const archiveClient = useArchiveClient()

  if (!canView) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to view clients.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const clients = data?.content ?? []

  const openCreate = () => {
    setEditing(undefined)
    setDialogOpen(true)
  }

  const openEdit = (client: ClientResponse) => {
    setEditing(client)
    setDialogOpen(true)
  }

  const handleArchive = (client: ClientResponse) => {
    if (!client.id || !window.confirm(`Archive “${client.name}”?`)) return
    archiveClient.mutate(
      { id: client.id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/clients' }] }) },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">Your customer accounts.</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New client
          </Button>
        )}
      </div>

      <ClientFormDialog open={dialogOpen} onOpenChange={setDialogOpen} client={editing} />

      <Input
        placeholder="Search by name or company…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="px-4 py-16 text-center text-sm text-destructive">Could not load clients.</p>
          ) : clients.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">No clients found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contract value</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client: ClientResponse) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-muted-foreground">{client.companyName || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{client.clientType}</TableCell>
                    <TableCell>
                      <Badge variant={client.status ? STATUS_VARIANT[client.status] : 'muted'}>
                        {client.status ?? 'UNKNOWN'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.contractValue != null
                        ? client.contractValue.toLocaleString(undefined, {
                            style: 'currency',
                            currency: 'USD',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Button variant="ghost" size="icon" onClick={() => openEdit(client)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canArchive && !client.archived && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleArchive(client)}
                            aria-label="Archive"
                          >
                            <Archive className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
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
