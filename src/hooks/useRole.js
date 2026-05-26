import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import RoleManager from '../services/rbac/RoleManager'

/**
 * Hook for role-based information
 *
 * Usage:
 *   const { role, roleName, permissions } = useRole()
 */
export function useRole() {
  const { currentUser } = useApp()

  return useMemo(() => ({
    /**
     * Get user's role
     */
    role: currentUser?.role,

    /**
     * Get human-readable role name
     */
    roleName: currentUser
      ? RoleManager.getRoleName(currentUser.role)
      : null,

    /**
     * Get all permissions for user's role
     */
    permissions: currentUser
      ? RoleManager.getPermissionsForRole(currentUser.role)
      : {},

    /**
     * Check if user is owner
     */
    isOwner: currentUser?.role === 'owner',

    /**
     * Check if user is admin
     */
    isAdmin: currentUser?.role === 'admin',

    /**
     * Check if user is accountant
     */
    isAccountant: currentUser?.role === 'accountant',

    /**
     * Check if user is employee
     */
    isEmployee: currentUser?.role === 'employee',

    /**
     * Check if user is viewer
     */
    isViewer: currentUser?.role === 'viewer',

    /**
     * Check if user is super admin
     */
    isSuperAdmin: currentUser?.isSuperAdmin === true,

    /**
     * Get role level for comparisons
     */
    roleLevel: currentUser
      ? RoleManager.getRoleLevel(currentUser.role)
      : 0,

    /**
     * Get all available org roles
     */
    availableRoles: RoleManager.getOrgRoles(),

    /**
     * Get permission details for action/resource combo
     */
    hasPermissionFor: (action, resource) => {
      if (!currentUser) return false
      const permission = `org:${action}_${resource}`
      const perms = RoleManager.getPermissionsForRole(currentUser.role)
      return perms[permission] === true
    },
  }), [currentUser])
}
