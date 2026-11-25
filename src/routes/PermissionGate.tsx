import type { ReactNode } from 'react'
import { useAuth } from '@/store/auth'

/**
 * Renders children only if the current user holds the given permission.
 * Server endpoints enforce the same permission — this just hides UI the user
 * can't use (never the only line of defence).
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { hasPermission } = useAuth()
  return <>{hasPermission(permission) ? children : fallback}</>
}
