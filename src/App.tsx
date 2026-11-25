import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '@/features/auth/LoginPage'
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import ActivityPage from '@/features/activity/ActivityPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import UsersPage from '@/features/users/UsersPage'
import RolesPage from '@/features/roles/RolesPage'
import ClientsPage from '@/features/clients/ClientsPage'
import ProjectsPage from '@/features/projects/ProjectsPage'
import TasksPage from '@/features/tasks/TasksPage'
import EmployeesPage from '@/features/employees/EmployeesPage'
import DepartmentsPage from '@/features/departments/DepartmentsPage'
import TimesheetsPage from '@/features/timesheets/TimesheetsPage'
import ApprovalsInboxPage from '@/features/approvals/ApprovalsInboxPage'
import InvoicesPage from '@/features/invoices/InvoicesPage'
import ExpensesPage from '@/features/expenses/ExpensesPage'
import LeadsPage from '@/features/sales/LeadsPage'
import OpportunitiesPage from '@/features/sales/OpportunitiesPage'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/routes/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/pipeline" element={<OpportunitiesPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/timesheets" element={<TimesheetsPage />} />
          <Route path="/approvals" element={<ApprovalsInboxPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roles" element={<RolesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
