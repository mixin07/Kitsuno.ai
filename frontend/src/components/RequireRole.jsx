import { Navigate } from 'react-router-dom'
import { isRoleAllowed, roleHomePath } from '../constants/roles.js'
import { useAuth } from '../hooks/useAuth.js'

export default function RequireRole({ roles, children }) {
  const { user } = useAuth()

  // Block pending or unapproved instructor accounts from accessing instructor workspaces
  if (
    user?.requested_role === 'INSTRUCTOR' &&
    user?.approval_status !== 'APPROVED'
  ) {
    return <Navigate to="/pending-approval" replace />
  }

  if (
    roles.includes('INSTRUCTOR') &&
    user?.role === 'INSTRUCTOR' &&
    user?.approval_status !== 'APPROVED'
  ) {
    return <Navigate to="/pending-approval" replace />
  }

  if (!isRoleAllowed(user?.role, roles)) {
    return <Navigate to={roleHomePath(user?.role)} replace />
  }

  return children
}