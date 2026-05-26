import RoleManager from '../rbac/RoleManager'

/**
 * PermissionChecker: Runtime permission validation
 *
 * Used throughout components to check access before rendering
 * or performing operations
 */

class PermissionChecker {
  constructor(authService, tenantService) {
    this.authService = authService
    this.tenantService = tenantService
  }

  /**
   * Check if current user can access a feature
   * @param {string} feature - 'invoices', 'expenses', 'users', etc.
   * @returns {boolean}
   */
  canAccessFeature(feature) {
    const user = this.authService.getCurrentUser()
    if (!user) return false

    // Super admin cannot access org features
    if (user.isSuperAdmin) {
      return feature.startsWith('system:')
    }

    const org = this.authService.getCurrentOrg()
    if (!org) return false

    // Check if org plan includes this feature
    const allowedFeatures = org.metadata?.features || []
    return allowedFeatures.includes(feature) || feature === 'default'
  }

  /**
   * Check if user can perform action on resource
   * @param {object} user
   * @param {string} action - 'create', 'read', 'update', 'delete'
   * @param {string} resource - 'invoice', 'expense', etc.
   * @returns {boolean}
   */
  canPerformAction(user, action, resource) {
    if (!user) return false

    // Super admin has system permissions only
    if (user.isSuperAdmin) {
      return false
    }

    return RoleManager.canPerformAction(user, action, resource)
  }

  /**
   * Check if user can edit a specific record
   * @param {string} resource - 'invoice', 'expense', etc.
   * @param {object} record - The record being accessed
   * @returns {boolean}
   */
  canEditRecord(resource, record) {
    const user = this.authService.getCurrentUser()
    if (!user) return false

    // Organization check
    if (record.orgId !== user.orgId) {
      return false // Cross-org access denied
    }

    // Action check
    return RoleManager.canPerformAction(user, 'edit', resource)
  }

  /**
   * Check if user can delete a specific record
   * @param {string} resource
   * @param {object} record
   * @returns {boolean}
   */
  canDeleteRecord(resource, record) {
    const user = this.authService.getCurrentUser()
    if (!user) return false

    if (record.orgId !== user.orgId) {
      return false
    }

    // Only owner/admin can delete
    return (
      RoleManager.isRoleHigherOrEqual(user.role, 'admin') &&
      RoleManager.canPerformAction(user, 'delete', resource)
    )
  }

  /**
   * Check if user can view a specific record
   * @param {string} resource
   * @param {object} record
   * @returns {boolean}
   */
  canViewRecord(resource, record) {
    const user = this.authService.getCurrentUser()
    if (!user) return false

    if (record.orgId !== user.orgId) {
      return false
    }

    return RoleManager.canPerformAction(user, 'view', resource)
  }

  /**
   * Check if user can manage organization
   * @returns {boolean}
   */
  canManageOrganization() {
    const user = this.authService.getCurrentUser()
    if (!user) return false

    return RoleManager.hasPermission(user, 'org:manage_org_settings')
  }

  /**
   * Check if user can manage team members
   * @returns {boolean}
   */
  canManageTeam() {
    const user = this.authService.getCurrentUser()
    if (!user) return false

    return RoleManager.hasPermission(user, 'org:manage_users')
  }

  /**
   * Check if user can view audit logs
   * @returns {boolean}
   */
  canViewAuditLogs() {
    const user = this.authService.getCurrentUser()
    if (!user) return false

    return RoleManager.hasPermission(user, 'org:view_audit_logs')
  }

  /**
   * Check if user can export data
   * @returns {boolean}
   */
  canExportData() {
    const user = this.authService.getCurrentUser()
    if (!user) return false

    return RoleManager.hasPermission(user, 'org:export_data')
  }

  /**
   * Check if user can import data
   * @returns {boolean}
   */
  canImportData() {
    const user = this.authService.getCurrentUser()
    if (!user) return false

    return RoleManager.hasPermission(user, 'org:import_data')
  }

  /**
   * Get resource filter predicate (for data filtering)
   * @param {string} resource
   * @returns {function}
   */
  getResourceFilterPredicate(resource) {
    const user = this.authService.getCurrentUser()
    if (!user) return (item) => false

    // Super admin cannot see org resources
    if (user.isSuperAdmin) return (item) => false

    // Filter by organization
    return (item) => item.orgId === user.orgId
  }

  /**
   * Get accessible resources for user
   * @param {string} resourceType - 'invoices', 'expenses', etc.
   * @param {Array} allResources
   * @returns {Array}
   */
  filterAccessibleResources(resourceType, allResources = []) {
    const user = this.authService.getCurrentUser()
    if (!user) return []

    if (user.isSuperAdmin) return []

    return allResources.filter((resource) =>
      this.canViewRecord(resourceType, resource)
    )
  }
}

export default PermissionChecker
