import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import RoleManager from '../services/rbac/RoleManager'

/**
 * Hook for permission checking
 *
 * Usage:
 *   const { can, canEdit, canDelete, canManageTeam } = usePermission()
 */
export function usePermission() {
  const { currentUser, permissionChecker } = useApp()

  return useMemo(() => ({
    /**
     * Check if user has a specific permission
     */
    can: (action, resource) => {
      if (!currentUser) return false
      return permissionChecker.canPerformAction(currentUser, action, resource)
    },

    /**
     * Check if user can edit
     */
    canEdit: (resource) => {
      if (!currentUser) return false
      return permissionChecker.canPerformAction(currentUser, 'edit', resource)
    },

    /**
     * Check if user can delete
     */
    canDelete: (resource) => {
      if (!currentUser) return false
      return permissionChecker.canPerformAction(currentUser, 'delete', resource)
    },

    /**
     * Check if user can create
     */
    canCreate: (resource) => {
      if (!currentUser) return false
      return permissionChecker.canPerformAction(currentUser, 'create', resource)
    },

    /**
     * Check if user can view
     */
    canView: (resource) => {
      if (!currentUser) return false
      return permissionChecker.canPerformAction(currentUser, 'view', resource)
    },

    /**
     * Check if user can access feature
     */
    canAccessFeature: (feature) => {
      return permissionChecker.canAccessFeature(feature)
    },

    /**
     * Check if user can manage team
     */
    canManageTeam: () => {
      return permissionChecker.canManageTeam()
    },

    /**
     * Check if user can manage org
     */
    canManageOrg: () => {
      return permissionChecker.canManageOrganization()
    },

    /**
     * Check if user can view audit logs
     */
    canViewAuditLogs: () => {
      return permissionChecker.canViewAuditLogs()
    },

    /**
     * Check if user can export data
     */
    canExportData: () => {
      return permissionChecker.canExportData()
    },

    /**
     * Check if user can import data
     */
    canImportData: () => {
      return permissionChecker.canImportData()
    },

    /**
     * Get user's role level
     */
    getRoleLevel: () => {
      if (!currentUser) return 0
      return RoleManager.getRoleLevel(currentUser.role)
    },

    /**
     * Check if user's role is >= required role
     */
    isRoleHigherOrEqual: (requiredRole) => {
      if (!currentUser) return false
      return RoleManager.isRoleHigherOrEqual(currentUser.role, requiredRole)
    },
  }), [currentUser, permissionChecker])
}
