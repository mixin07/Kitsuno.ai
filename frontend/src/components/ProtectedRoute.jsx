import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ks-bg)] text-[var(--ks-text)]">
      <p className="animate-pulse text-sm font-medium tracking-wide text-[var(--ks-text-muted)]">
        Loading...
      </p>
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return children
}