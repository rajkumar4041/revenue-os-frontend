import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '@/features/auth/LoginPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import UsersPage from '@/features/users/UsersPage'
import RolesPage from '@/features/roles/RolesPage'
import ClientsPage from '@/features/clients/ClientsPage'
import ProjectsPage from '@/features/projects/ProjectsPage'
import TasksPage from '@/features/tasks/TasksPage'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/routes/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roles" element={<RolesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
