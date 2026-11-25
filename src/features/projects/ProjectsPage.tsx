import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Plus } from 'lucide-react'
import { useListProjects } from '@/gen/hooks'
import type { ProjectResponse, ProjectResponseStatusEnum } from '@/gen/models/ProjectResponse'
import { useAuth } from '@/store/auth'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProjectFormDialog } from './ProjectFormDialog'

const STATUS_VARIANT: Record<ProjectResponseStatusEnum, BadgeProps['variant']> = {
  PLANNING: 'default',
  ACTIVE: 'success',
  ON_HOLD: 'warning',
  COMPLETED: 'muted',
  CANCELLED: 'destructive',
}

export default function ProjectsPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('PROJECT_VIEW')
  const canCreate = hasPermission('PROJECT_CREATE')
  const canUpdate = hasPermission('PROJECT_UPDATE')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectResponse | undefined>()

  const { data, isLoading, isError } = useListProjects(
    { page: 0, size: 50 },
    { query: { enabled: canView } },
  )

  if (!canView) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to view projects.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const projects = data?.content ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Delivery across your organization.</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            New project
          </Button>
        )}
      </div>

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editing} />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="px-4 py-16 text-center text-sm text-destructive">Could not load projects.</p>
          ) : projects.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Contract value</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project: ProjectResponse) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <Link to={`/tasks?projectId=${project.id}`} className="hover:underline">
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{project.code}</TableCell>
                    <TableCell>
                      <Badge variant={project.status ? STATUS_VARIANT[project.status] : 'muted'}>
                        {project.status ?? 'UNKNOWN'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{project.priority}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.contractValue != null
                        ? project.contractValue.toLocaleString(undefined, {
                            style: 'currency',
                            currency: 'USD',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(project)
                            setDialogOpen(true)
                          }}
                        >
                          Edit
                        </Button>
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
