import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, UserMinus } from 'lucide-react'
import { useListEmployees, useOffboardEmployee } from '@/gen/hooks'
import type { EmployeeResponse, EmployeeResponseEmploymentStatusEnum } from '@/gen/models/EmployeeResponse'
import { listEmployeesQueryParamsStatusEnum } from '@/gen/models/ListEmployees'
import type { ListEmployeesQueryParamsStatusEnum } from '@/gen/models/ListEmployees'
import { useAuth } from '@/store/auth'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmployeeFormDialog } from './EmployeeFormDialog'

const STATUS_VARIANT: Record<EmployeeResponseEmploymentStatusEnum, BadgeProps['variant']> = {
  ONBOARDING: 'warning',
  ACTIVE: 'success',
  ON_LEAVE: 'default',
  OFFBOARDING: 'warning',
  OFFBOARDED: 'muted',
}

export default function EmployeesPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('EMPLOYEE_VIEW')
  const canManage = hasPermission('EMPLOYEE_MANAGE')
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EmployeeResponse | undefined>()

  const { data, isLoading, isError } = useListEmployees(
    {
      page: 0,
      size: 50,
      status: (statusFilter || undefined) as ListEmployeesQueryParamsStatusEnum | undefined,
    },
    { query: { enabled: canView } },
  )
  const offboard = useOffboardEmployee()

  if (!canView) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to view employees.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const employees = data?.content ?? []

  const handleOffboard = (employee: EmployeeResponse) => {
    if (!employee.id || !window.confirm(`Offboard ${employee.fullName}?`)) return
    offboard.mutate(
      { id: employee.id, data: {} },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/employees' }] }) },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">Your people, from onboarding to offboarding.</p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Onboard employee
          </Button>
        )}
      </div>

      <EmployeeFormDialog open={dialogOpen} onOpenChange={setDialogOpen} employee={editing} />

      <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
        <option value="">All statuses</option>
        {Object.values(listEmployeesQueryParamsStatusEnum).map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </Select>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="px-4 py-16 text-center text-sm text-destructive">Could not load employees.</p>
          ) : employees.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">No employees yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee: EmployeeResponse) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="font-medium">{employee.fullName}</div>
                      <div className="text-xs text-muted-foreground">{employee.email}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{employee.designation || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{employee.employmentType}</TableCell>
                    <TableCell>
                      <Badge variant={employee.employmentStatus ? STATUS_VARIANT[employee.employmentStatus] : 'muted'}>
                        {employee.employmentStatus ?? 'UNKNOWN'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing(employee)
                              setDialogOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          {employee.employmentStatus !== 'OFFBOARDED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOffboard(employee)}
                              aria-label="Offboard"
                            >
                              <UserMinus className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
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
