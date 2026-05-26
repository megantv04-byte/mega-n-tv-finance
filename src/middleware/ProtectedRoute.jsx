import { Navigate } from 'react-router-dom'
import { useTenant } from '../context/TenantContext'

/**
 * ProtectedRoute - Ensures user is authenticated before accessing a route
 */
export function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useTenant()

  if (loading) {
    return <div className="p-8 text-center">Duke u ngarku...</div>
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}

/**
 * SuperAdminRoute - Only super admins can access
 */
export function SuperAdminRoute({ children }) {
  const { isLoggedIn, isSuperAdmin, loading } = useTenant()

  if (loading) {
    return <div className="p-8 text-center">Duke u ngarku...</div>
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (!isSuperAdmin()) {
    return <Navigate to="/app" replace />
  }

  return children
}

/**
 * OrganizationRoute - Only organization users can access
 */
export function OrganizationRoute({ children }) {
  const { isLoggedIn, isSuperAdmin, loading } = useTenant()

  if (loading) {
    return <div className="p-8 text-center">Duke u ngarku...</div>
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // Super admins can't access org routes
  if (isSuperAdmin()) {
    return <Navigate to="/system" replace />
  }

  return children
}

/**
 * PermissionRoute - Check if user has specific permission
 */
export function PermissionRoute({ permission, children, fallback = null }) {
  const { isLoggedIn, hasPermission, loading } = useTenant()

  if (loading) {
    return <div className="p-8 text-center">Duke u ngarku...</div>
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (!hasPermission(permission)) {
    return fallback || <Navigate to="/unauthorized" replace />
  }

  return children
}

/**
 * RoleRoute - Check if user has specific role
 */
export function RoleRoute({ roles = [], children, fallback = null }) {
  const { isLoggedIn, currentRole, loading } = useTenant()

  if (loading) {
    return <div className="p-8 text-center">Duke u ngarku...</div>
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (!roles.includes(currentRole)) {
    return fallback || <Navigate to="/unauthorized" replace />
  }

  return children
}
