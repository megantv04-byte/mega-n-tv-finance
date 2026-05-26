/**
 * RoleManager: RBAC Implementation
 *
 * ROLE HIERARCHY & PERMISSIONS DEFINITION
 *
 * Super Admin:
 *   - System-wide access
 *   - Manage organizations
 *   - View system metrics
 *   - NO access to organization data
 *
 * Organization Roles (in context of org):
 *   Owner      - Full org access
 *   Admin      - Team management, data access
 *   Accountant - Financial data access
 *   Employee   - Limited data creation/access
 *   Viewer     - Read-only access
 */

const ROLE_HIERARCHY = {
  super_admin: 100, // System level
  owner: 50, // Org level - highest
  admin: 40,
  accountant: 30,
  employee: 20,
  viewer: 10,
}

const ROLE_PERMISSIONS = {
  super_admin: {
    // System management
    'system:manage_organizations': true,
    'system:view_analytics': true,
    'system:manage_billing': true,
    'system:view_audit_logs': true,
    'system:manage_super_admins': true,

    // Explicitly NO org data access
    'org:view_any': false,
    'org:create_invoice': false,
    'org:manage_users': false,
  },

  owner: {
    // Organization management
    'org:view_org': true,
    'org:manage_org_settings': true,
    'org:manage_users': true,
    'org:manage_roles': true,
    'org:manage_billing': true,
    'org:view_audit_logs': true,

    // Data operations
    'org:create_invoice': true,
    'org:edit_invoice': true,
    'org:delete_invoice': true,
    'org:view_invoice': true,
    'org:create_expense': true,
    'org:edit_expense': true,
    'org:delete_expense': true,
    'org:view_expense': true,
    'org:create_customer': true,
    'org:edit_customer': true,
    'org:delete_customer': true,
    'org:view_customer': true,
    'org:create_payment': true,
    'org:edit_payment': true,
    'org:delete_payment': true,
    'org:view_payment': true,
    'org:view_reports': true,
    'org:export_data': true,
    'org:import_data': true,
    'org:create_supplier': true,
    'org:edit_supplier': true,
    'org:delete_supplier': true,
    'org:view_supplier': true,
    'org:create_item': true,
    'org:edit_item': true,
    'org:delete_item': true,
    'org:view_item': true,
  },

  admin: {
    'org:view_org': true,
    'org:manage_users': true,
    'org:view_audit_logs': true,

    'org:create_invoice': true,
    'org:edit_invoice': true,
    'org:delete_invoice': true,
    'org:view_invoice': true,
    'org:create_expense': true,
    'org:edit_expense': true,
    'org:delete_expense': true,
    'org:view_expense': true,
    'org:create_customer': true,
    'org:edit_customer': true,
    'org:delete_customer': true,
    'org:view_customer': true,
    'org:create_payment': true,
    'org:edit_payment': true,
    'org:delete_payment': true,
    'org:view_payment': true,
    'org:view_reports': true,
    'org:export_data': true,
    'org:import_data': true,
    'org:create_supplier': true,
    'org:edit_supplier': true,
    'org:delete_supplier': true,
    'org:view_supplier': true,
    'org:create_item': true,
    'org:edit_item': true,
    'org:delete_item': true,
    'org:view_item': true,
  },

  accountant: {
    'org:view_org': true,
    'org:view_users': true,

    'org:create_invoice': true,
    'org:edit_invoice': true,
    'org:view_invoice': true,
    'org:create_expense': true,
    'org:edit_expense': true,
    'org:view_expense': true,
    'org:view_customer': true,
    'org:create_customer': true,
    'org:create_payment': true,
    'org:edit_payment': true,
    'org:view_payment': true,
    'org:view_reports': true,
    'org:export_data': true,
    'org:view_supplier': true,
    'org:view_item': true,
  },

  employee: {
    'org:view_org': true,

    'org:create_invoice': true,
    'org:view_invoice': true,
    'org:create_expense': true,
    'org:view_expense': true,
    'org:view_customer': true,
    'org:create_payment': true,
    'org:view_payment': true,
    'org:view_supplier': true,
    'org:view_item': true,
  },

  viewer: {
    'org:view_org': true,
    'org:view_invoice': true,
    'org:view_expense': true,
    'org:view_customer': true,
    'org:view_payment': true,
    'org:view_reports': true,
    'org:view_supplier': true,
    'org:view_item': true,
  },
}

class RoleManager {
  /**
   * Check if user has permission
   * @param {object} user
   * @param {string} permission - e.g., 'org:create_invoice'
   * @returns {boolean}
   */
  static hasPermission(user, permission) {
    if (!user) return false

    // Super admins have system-level permissions
    if (user.isSuperAdmin) {
      const perms = ROLE_PERMISSIONS.super_admin
      return perms[permission] !== false
    }

    // Organization users
    const rolePerms = ROLE_PERMISSIONS[user.role]
    if (!rolePerms) return false

    return rolePerms[permission] === true
  }

  /**
   * Check if user can perform action on resource
   * @param {object} user
   * @param {string} action - 'create', 'read', 'update', 'delete', 'edit', 'view'
   * @param {string} resource - 'invoice', 'expense', etc.
   * @returns {boolean}
   */
  static canPerformAction(user, action, resource) {
    const actionMap = {
      read: 'view',
      update: 'edit',
      delete: 'delete',
      create: 'create',
      edit: 'edit',
      view: 'view',
    }

    const mappedAction = actionMap[action] || action
    const permission = `org:${mappedAction}_${resource}`
    return this.hasPermission(user, permission)
  }

  /**
   * Get role level (for comparisons)
   * @param {string} role
   * @returns {number}
   */
  static getRoleLevel(role) {
    return ROLE_HIERARCHY[role] || 0
  }

  /**
   * Check if user's role is >= another role
   * @param {string} userRole
   * @param {string} requiredRole
   * @returns {boolean}
   */
  static isRoleHigherOrEqual(userRole, requiredRole) {
    return this.getRoleLevel(userRole) >= this.getRoleLevel(requiredRole)
  }

  /**
   * Get all permissions for a role
   * @param {string} role
   * @returns {object}
   */
  static getPermissionsForRole(role) {
    return ROLE_PERMISSIONS[role] || {}
  }

  /**
   * Get all roles
   * @returns {Array<string>}
   */
  static getAllRoles() {
    return Object.keys(ROLE_HIERARCHY)
  }

  /**
   * Get org-level roles (exclude super_admin)
   * @returns {Array<string>}
   */
  static getOrgRoles() {
    return ['owner', 'admin', 'accountant', 'employee', 'viewer']
  }

  /**
   * Get human-readable role name
   * @param {string} role
   * @returns {string}
   */
  static getRoleName(role) {
    const names = {
      super_admin: 'Super Admin',
      owner: 'Owner',
      admin: 'Admin',
      accountant: 'Accountant',
      employee: 'Employee',
      viewer: 'Viewer',
    }
    return names[role] || role
  }
}

export default RoleManager
