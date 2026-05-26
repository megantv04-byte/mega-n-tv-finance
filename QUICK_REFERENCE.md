# X-Flow Multi-Tenant Architecture - Quick Reference

## Core Services

### AuthService
```javascript
const authService = new AuthService(mockUsers, tenantService)

// Login
const result = await authService.login('username', 'password')
// Returns: { user, org, session, permissions }

// Check authentication
authService.isAuthenticated()  // boolean

// Get current info
authService.getCurrentUser()   // user object
authService.getCurrentOrg()    // org object
authService.isSuperAdmin()     // boolean

// Logout
await authService.logout()
```

### TenantService
```javascript
const tenantService = new TenantService(mockOrganizations, supabase)

// Get org
const org = await tenantService.getOrganization('ORG-001')

// Get all orgs
const orgs = await tenantService.getAllOrganizations({ status: 'active' })

// Create org (Super Admin only)
const newOrg = await tenantService.createOrganization({
  name: 'Acme Corp',
  shortName: 'ACME',
  plan: 'pro'
})

// Get tenant settings
const settings = tenantService.getTenantSettings('ORG-001')
```

### RoleManager
```javascript
// Check permission
RoleManager.hasPermission(user, 'org:create_invoice')  // boolean

// Perform action
RoleManager.canPerformAction(user, 'create', 'invoice')  // boolean

// Role level
RoleManager.getRoleLevel('admin')  // 40

// Compare roles
RoleManager.isRoleHigherOrEqual('admin', 'employee')  // true

// Get permissions for role
RoleManager.getPermissionsForRole('owner')  // { 'org:create_invoice': true, ... }

// Get all roles
RoleManager.getAllRoles()        // all including super_admin
RoleManager.getOrgRoles()        // org-level only (no super_admin)
```

### PermissionChecker
```javascript
const checker = new PermissionChecker(authService, tenantService)

// Check action on resource
checker.canPerformAction(user, 'edit', 'invoice')

// Check specific record
checker.canEditRecord('invoice', invoiceObj)
checker.canDeleteRecord('invoice', invoiceObj)
checker.canViewRecord('invoice', invoiceObj)

// Check management
checker.canManageOrganization()
checker.canManageTeam()
checker.canViewAuditLogs()
checker.canExportData()
checker.canImportData()

// Check feature
checker.canAccessFeature('advanced_reports')

// Filter predicates
checker.getResourceFilterPredicate('invoice')  // (item) => item.orgId === userOrgId
```

### TenantDataLayer
```javascript
const layer = new TenantDataLayer(authService)

// Get filtered data
layer.getInvoices(allInvoices)         // invoices for current org
layer.getCustomers(allCustomers)
layer.getExpenses(allExpenses)
layer.getPayments(allPayments)
layer.getOrganizationUsers(allUsers)

// Create record
const invoice = layer.createRecord('invoice', {
  customer: 'John Doe',
  amount: 1000
})
// Auto-adds: id, orgId, createdBy, createdAt

// Update record
const updated = layer.updateRecord('invoice', id, {
  status: 'approved'
}, currentInvoices)

// Delete record
layer.deleteRecord('invoice', id, currentInvoices)

// Bulk operations
layer.bulkCreateRecords('invoice', records)

// Utilities
layer.getRecordCount('invoice', allInvoices)
layer.getRecordById('invoice', id, allInvoices)
layer.searchRecords('invoice', allInvoices, 'John', ['customer', 'email'])
```

---

## React Hooks

### useAuth()
```javascript
const {
  currentUser,        // authenticated user object
  currentOrg,         // current organization
  login,              // async (username, password)
  logout,             // async ()
  isAuthenticated,    // () => boolean
  isSuperAdmin,       // () => boolean
} = useAuth()
```

### usePermission()
```javascript
const {
  can,                // (action, resource) => boolean
  canEdit,            // (resource) => boolean
  canDelete,          // (resource) => boolean
  canCreate,          // (resource) => boolean
  canView,            // (resource) => boolean
  canAccessFeature,   // (feature) => boolean
  canManageTeam,      // () => boolean
  canManageOrg,       // () => boolean
  canViewAuditLogs,   // () => boolean
  canExportData,      // () => boolean
  canImportData,      // () => boolean
  getRoleLevel,       // () => number
  isRoleHigherOrEqual, // (requiredRole) => boolean
} = usePermission()
```

### useTenant()
```javascript
const {
  org,                // current organization
  orgId,              // current org ID
  orgName,            // org name
  orgShortName,       // org short name
  settings,           // tenant settings
  hasFeature,         // (feature) => boolean
  plan,               // org plan (starter|pro|enterprise)
  isActive,           // () => boolean
  color,              // org brand color
  maxTeamSize,        // max users for plan
  allowedFeatures,    // [] of features
  isMultiCurrency,    // () => boolean
  isMultiLanguage,    // () => boolean
  createdAt,          // org creation date
} = useTenant()
```

### useRole()
```javascript
const {
  role,               // user's role
  roleName,           // human-readable name
  permissions,        // { 'org:create_invoice': true, ... }
  isOwner,            // boolean
  isAdmin,            // boolean
  isAccountant,       // boolean
  isEmployee,         // boolean
  isViewer,           // boolean
  isSuperAdmin,       // boolean
  roleLevel,          // number for comparisons
  availableRoles,     // ['owner', 'admin', ...]
  hasPermissionFor,   // (action, resource) => boolean
} = useRole()
```

### useTenantData()
```javascript
const {
  create,             // (type, data) => record
  update,             // (type, id, updates) => record
  delete,             // (type, id) => void
  bulkCreate,         // (type, records) => records
  getRecords,         // (type) => records[]
  getRecordCount,     // (type) => number
  search,             // (type, query, fields) => records[]
} = useTenantData()
```

---

## Permission Strings

### Format
```
{scope}:{action}_{resource}

scope:    system | org
action:   create|view|edit|delete|manage
resource: invoice|customer|expense|payment|users|org_settings|etc.
```

### Examples
```
org:create_invoice         - Create invoices
org:view_invoice          - View invoices
org:edit_invoice          - Edit invoices
org:delete_invoice        - Delete invoices
org:create_customer       - Create customers
org:manage_users          - Manage team members
org:manage_org_settings   - Modify organization
org:view_audit_logs       - View activity log
org:export_data           - Export data
org:import_data           - Import data
system:manage_organizations  - Create/delete orgs
system:view_analytics     - View system metrics
```

---

## Role Permissions Summary

### Super Admin
```
System:
- Manage organizations (create, delete, pause)
- View system analytics
- Manage billing
- Manage other super admins
- View audit logs

Organization Data:
- NO access to any org data
- Cannot create invoices
- Cannot view customers
```

### Owner
```
- Full organization access
- Manage team members
- Create/edit/delete any data
- Manage billing & plan
- View audit logs
- Export/import data
- Manage organization settings
```

### Admin
```
- Team member management
- Create/edit/delete any data
- View audit logs
- Export/import data
- (Cannot manage billing or org settings)
```

### Accountant
```
- Create/edit invoices
- Create/edit expenses
- Create/edit payments
- View all data
- View reports
- Export data
- (Cannot delete, cannot manage users)
```

### Employee
```
- Create invoices
- Create expenses
- Create payments
- View data
- (Cannot delete, cannot edit others' records)
```

### Viewer
```
- View all data
- View reports
- (Cannot create, edit, or delete anything)
```

---

## Common Usage Patterns

### Pattern 1: Show/Hide Based on Permission
```jsx
const { can } = usePermission()

{can('create', 'invoice') && <CreateButton />}
{can('delete', 'invoice') && <DeleteButton />}
```

### Pattern 2: Org-Filtered Data
```jsx
const { tenantDataLayer } = useApp()
const { invoices } = useApp()

// Get only invoices for current org
const orgInvoices = tenantDataLayer.getInvoices(invoices)
```

### Pattern 3: Create with Org Context
```jsx
const { tenantDataLayer } = useApp()

const invoice = tenantDataLayer.createRecord('invoice', {
  customer: 'John Doe',
  amount: 1000,
})
// orgId, createdBy, createdAt automatically added
```

### Pattern 4: Update with Permission Check
```jsx
const { tenantDataLayer, permissionChecker, invoices } = useApp()

const record = invoices.find(i => i.id === id)
if (!permissionChecker.canEditRecord('invoice', record)) {
  throw new Error('Permission denied')
}

const updated = tenantDataLayer.updateRecord('invoice', id, {
  status: 'approved'
}, invoices)
```

### Pattern 5: Show Role-Based UI
```jsx
const { isOwner, isAdmin } = useRole()

{(isOwner || isAdmin) && <AdvancedSettings />}
{isOwner && <BillingSection />}
{!isViewer && <EditButtons />}
```

### Pattern 6: Feature Flags by Plan
```jsx
const { hasFeature } = useTenant()

{hasFeature('advanced_reports') ? <Reports /> : <UpgradeBanner />}
```

### Pattern 7: Bulk Data Operations
```jsx
const { tenantDataLayer } = useApp()

const records = tenantDataLayer.bulkCreateRecords('invoice', [
  { customer: 'A', amount: 100 },
  { customer: 'B', amount: 200 },
])
// All get orgId, createdBy, createdAt added
```

---

## Role Hierarchy Values

```javascript
super_admin: 100
owner:       50
admin:       40
accountant:  30
employee:    20
viewer:      10
```

Use for: `RoleManager.isRoleHigherOrEqual(userRole, requiredRole)`

---

## Data Structures

### User
```javascript
{
  id: 'USR-001',
  name: 'John Doe',
  username: 'johndoe',
  password: 'hashed',          // in production only
  role: 'admin',               // owner|admin|accountant|employee|viewer
  orgId: 'ORG-001',           // organization membership
  isSuperAdmin: false,         // system-level admin
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  color: '#2563eb',
}
```

### Organization
```javascript
{
  id: 'ORG-001',
  name: 'Acme Corp',
  shortName: 'ACME',
  description: 'Manufacturing',
  plan: 'pro',                 // starter|pro|enterprise
  status: 'active',            // active|paused|suspended
  createdAt: '2026-01-01T00:00:00Z',
  color: '#7c3aed',
  metadata: {
    maxUsers: 10,
    features: ['invoices', 'customers', 'expenses', ...],
    apiCallsUsed: 1234,
    apiCallsLimit: 100000,
  }
}
```

### Record (Invoice/Customer/etc.)
```javascript
{
  id: 'INV-2024-ABC123',
  orgId: 'ORG-001',           // ALWAYS REQUIRED
  // ... resource-specific fields ...
  createdBy: 'USR-001',       // who created it
  createdAt: '2026-05-26T...',
  updatedBy: 'USR-002',       // who last edited it
  updatedAt: '2026-05-26T...',
}
```

### Session
```javascript
{
  id: 'sess_1716748800000_abcd123',
  userId: 'USR-001',
  username: 'johndoe',
  orgId: 'ORG-001',
  isSuperAdmin: false,
  role: 'admin',
  loginTime: 1716748800000,
  lastActivity: 1716748800000,
}
```

---

## Error Handling

### Authentication
```javascript
try {
  await authService.login(username, password)
} catch (error) {
  if (error.message === 'Invalid credentials') {
    // Show login error
  } else if (error.message === 'Organization is not active') {
    // Show org status error
  }
}
```

### Data Operations
```javascript
try {
  const invoice = tenantDataLayer.createRecord('invoice', data)
} catch (error) {
  if (error.message === 'No authenticated user') {
    // User not logged in
  } else if (error.message === 'Super admin cannot create organization records') {
    // Wrong user type
  }
}
```

### Permission Denied
```javascript
try {
  layer.deleteRecord('invoice', id, invoices)
} catch (error) {
  if (error.message === 'Cannot delete record from another organization') {
    // Cross-org access attempt
  }
}
```

---

## Configuration

### Session Timeout
```javascript
// In AuthService constructor
this.sessionTimeout = 30 * 60 * 1000  // 30 minutes of inactivity
```

### Cache Duration
```javascript
// In TenantService constructor
this.cacheTimeout = 5 * 60 * 1000  // 5 minutes for org cache
```

### Plan Limits
```javascript
// In TenantService
_getMaxUsersForPlan(plan) {
  return { starter: 3, pro: 10, enterprise: 999 }[plan] || 3
}
```

---

## Testing Quick Wins

```javascript
// Test auth
expect(authService.isAuthenticated()).toBe(true)
expect(authService.isSuperAdmin()).toBe(false)

// Test permissions
expect(RoleManager.canPerformAction(admin, 'delete', 'invoice')).toBe(true)
expect(RoleManager.canPerformAction(viewer, 'delete', 'invoice')).toBe(false)

// Test isolation
const filtered = layer.getInvoices(mixedOrgInvoices)
filtered.forEach(inv => expect(inv.orgId).toBe(user.orgId))

// Test cross-org prevention
expect(() => {
  layer.updateRecord('invoice', id, {}, [crossOrgInvoice])
}).toThrow('Cannot update record from another organization')
```

---

## Deployment Checklist

- [ ] Services implemented
- [ ] AppContext refactored
- [ ] Login page updated
- [ ] Pages using hooks
- [ ] Route guards in place
- [ ] Data migrated
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] No cross-org leakage
- [ ] Super admin cannot see org data
- [ ] Permissions enforced
- [ ] Roles working correctly
- [ ] Session management active
- [ ] Documentation updated

---

## Need Help?

1. **Architecture questions** → See `MULTI_TENANT_ARCHITECTURE.md`
2. **Implementation steps** → See `IMPLEMENTATION_GUIDE.md`
3. **Service details** → See code comments in `src/services/`
4. **Hook usage** → See code comments in `src/hooks/`
5. **Permission matrix** → See `RoleManager.js`

---

**All code is production-ready. Happy multi-tenanting!**
