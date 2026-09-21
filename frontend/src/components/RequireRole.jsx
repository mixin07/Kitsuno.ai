import { Navigate } from 'react-router-dom'
import { isRoleAllowed, roleHomePath } from '../constants/roles.js'
import { useAuth } from '../hooks/useAuth.js'

export default function RequireRole({ roles, children }) {
  const { user } = useAuth()

  if (!isRoleAllowed(user?.role, roles)) {
    return <Navigate to={roleHomePath(user?.role)} replace />
  }

  return children
}