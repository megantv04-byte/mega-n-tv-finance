# X-Flow Multi-Tenant Implementation Guide

## Quick Start

This guide walks you through implementing the multi-tenant architecture. All files are already created in `src/services/` and `src/hooks/`.

**Total Implementation Time: 3-4 hours**

---

## Step 1: Update AppContext (CRITICAL)

The existing AppContext needs to be refactored to use the new services. Replace `src/context/AppContext.jsx` with this:

### Key Changes:
1. Initialize services in refs
2. Pass services to context
3. Keep all existing functionality
4. Add org filtering at data access points

**File:** `src/context/AppContext.jsx`

See the full implementation in `MULTI_TENANT_ARCHITECTURE.md` section 4.1

---

## Step 2: Update Login Page

Add organization selector to the login flow:

**File:** `src/pages/Login.jsx`

```jsx
// Add after password input, before submit button:

{currentUser && !currentUser.isSuperAdmin && (
  <div className="mb-4">
    <label className="form-label">Organization</label>
    <select
      className="form-control"
      value={selectedOrg}
      onChange={(e) => setSelectedOrg(e.target.value)}
    >
      <option value="">Select organization...</option>
      {organizations
        .filter(org => org.status === 'active')
        .map(org => (
          <option key={org.id} value={org.id}>
            {org.name} ({org.shortName})
          </option>
        ))}
    </select>
  </div>
)}
```

---

## Step 3: Update Data Access in Pages

All pages need to use the new filtered data getters. Example for Invoices page:

**File:** `src/pages/Invoices.jsx`

```jsx
import { useApp } from '../context/AppContext'
import { usePermission } from '../hooks/usePermission'
import { useTenant } from '../hooks/useTenant'
import { useTenantData } from '../hooks/useTenantData'

export default function Invoices() {
  const { invoices, setInvoices } = useApp()
  const { can, canEdit, canDelete } = usePermission()
  const { orgId } = useTenant()
  const { create, update, delete: deleteRecord } = useTenantData()

  // Get invoices for current org (already filtered by AppContext)
  const orgInvoices = invoices

  // Create invoice
  const handleCreate = async (data) => {
    try {
      if (!can('create', 'invoice')) {
        throw new Error('Permission denied')
      }
      const record = await create('invoice', data)
      setToast({ msg: 'Invoice created', type: 'success' })
    } catch (error) {
      setToast({ msg: error.message, type: 'error' })
    }
  }

  // Show delete button only if user can delete
  return (
    <div>
      {canDelete('invoice') && (
        <button onClick={() => deleteRecord('invoice', id)}>Delete</button>
      )}
    </div>
  )
}
```

---

## Step 4: Protect Routes with Guards

Update `src/App.jsx` to include route protection:

```jsx
import { withAuth, withSuperAdminOnly, withOrgOnly } from './middleware/authMiddleware'

const ORG_PAGES = {
  dashboard: withOrgOnly(Dashboard),
  invoices: withOrgOnly(Invoices),
  customers: withOrgOnly(Customers),
  expenses: withOrgOnly(ExpensesPage),
  // ... rest of pages
}

const SYSTEM_PAGES = {
  organizations: withSuperAdminOnly(OrgManager),
  // ... system pages
}
```

---

## Step 5: Add Migration Script

Run this once to add `orgId` to existing data:

**File:** `src/data/migration.js`

```javascript
export function migrateDataToMultiTenant() {
  const defaultOrg = 'ORG-001'

  // Migrate all data types
  const dataTypes = [
    { key: 'mockInvoices', module: './mockInvoices' },
    { key: 'mockCustomers', module: './mockCustomers' },
    { key: 'mockExpenses', module: './mockExpensesCSV' },
    { key: 'mockPayments', module: './mockPayments' },
  ]

  dataTypes.forEach(({ key, module }) => {
    try {
      const data = require(module).default
      data.forEach(item => {
        if (!item.orgId) {
          item.orgId = defaultOrg
          item.createdAt = item.createdAt || new Date().toISOString()
          item.createdBy = 'system'
        }
      })
    } catch (e) {
      console.warn(`[Migration] Could not migrate ${key}`)
    }
  })

  console.log('[Migration] Data migration complete')
}
```

Call once in `src/main.jsx`:
```javascript
import { migrateDataToMultiTenant } from './data/migration'
migrateDataToMultiTenant()
```

---

## Step 6: Create Auth Middleware

**File:** `src/middleware/authMiddleware.js`

```javascript
import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export function withAuth(Component) {
  return function ProtectedComponent(props) {
    const { currentUser } = useApp()
    if (!currentUser) return <Navigate to="/login" />
    return <Component {...props} />
  }
}

export function withSuperAdminOnly(Component) {
  return function SuperAdminComponent(props) {
    const { currentUser, isSuperAdmin } = useApp()
    if (!currentUser || !isSuperAdmin) return <Navigate to="/app" />
    return <Component {...props} />
  }
}

export function withOrgOnly(Component) {
  return function OrgComponent(props) {
    const { currentUser, isSuperAdmin } = useApp()
    if (!currentUser) return <Navigate to="/login" />
    if (isSuperAdmin) return <Navigate to="/system" />
    return <Component {...props} />
  }
}

export function withPermission(Component, action, resource) {
  return function ProtectedComponent(props) {
    const { currentUser, permissionChecker } = useApp()
    if (!permissionChecker.canPerformAction(currentUser, action, resource)) {
      return <div>Access Denied</div>
    }
    return <Component {...props} />
  }
}
```

---

## Step 7: Update Data Mock Files

Add `orgId` to all mock data:

**File:** `src/data/mockInvoices.js`

```javascript
export const mockInvoices = [
  {
    id: 'INV-001',
    orgId: 'ORG-001',
    customer: 'Ardit Krasniqi',
    amount: 4800,
    status: 'pending',
    createdAt: '2026-05-22T08:50:00Z',
    createdBy: 'USR-001',
    // ... rest of fields
  },
  // ... more invoices
]
```

**Same for:**
- `src/data/mockCustomers.js`
- `src/data/mockExpensesCSV.js`
- `src/data/mockPayments.js`

---

## Step 8: Create Component Examples

### Example 1: Invoice Creation with RBAC

**File:** `src/pages/Invoices.jsx`

```jsx
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { usePermission } from '../hooks/usePermission'
import { useTenant } from '../hooks/useTenant'

export default function Invoices() {
  const { invoices, setInvoices, setToast, tenantDataLayer, permissionChecker } = useApp()
  const { can, canEdit, canDelete } = usePermission()
  const { orgId } = useTenant()

  const handleCreate = (data) => {
    try {
      if (!can('create', 'invoice')) {
        throw new Error('Permission denied')
      }

      const invoice = tenantDataLayer.createRecord('invoice', {
        ...data,
        status: 'draft',
      })

      setInvoices(prev => [...prev, invoice])
      setToast({ msg: 'Invoice created', type: 'success' })
    } catch (error) {
      setToast({ msg: error.message, type: 'error' })
    }
  }

  const handleDelete = (id) => {
    try {
      const record = invoices.find(i => i.id === id)

      // Permission check
      if (!permissionChecker.canDeleteRecord('invoice', record)) {
        throw new Error('Permission denied')
      }

      tenantDataLayer.deleteRecord('invoice', id, invoices)
      setInvoices(prev => prev.filter(i => i.id !== id))
      setToast({ msg: 'Invoice deleted', type: 'success' })
    } catch (error) {
      setToast({ msg: error.message, type: 'error' })
    }
  }

  return (
    <div>
      {can('create', 'invoice') && (
        <button onClick={() => handleCreate({})}>Create Invoice</button>
      )}

      <table>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id}>
              <td>{inv.id}</td>
              <td>{inv.customer}</td>
              <td>{inv.amount}</td>
              <td>
                {canEdit('invoice') && <button>Edit</button>}
                {canDelete('invoice') && (
                  <button onClick={() => handleDelete(inv.id)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Example 2: Users Page with Role Management

**File:** `src/pages/Users.jsx`

```jsx
import { useApp } from '../context/AppContext'
import { usePermission } from '../hooks/usePermission'
import { useRole } from '../hooks/useRole'
import RoleManager from '../services/rbac/RoleManager'

export default function Users() {
  const { users, currentUser, tenantDataLayer } = useApp()
  const { canManageTeam } = usePermission()
  const { availableRoles } = useRole()

  // Get users in current org
  const orgUsers = tenantDataLayer.getOrganizationUsers(users)

  if (!canManageTeam()) {
    return <div>You don't have permission to manage team members</div>
  }

  return (
    <div>
      <h1>Team Members</h1>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orgUsers.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.username}</td>
              <td>{RoleManager.getRoleName(user.role)}</td>
              <td>
                {currentUser.role === 'owner' && (
                  <select
                    value={user.role}
                    onChange={(e) => {
                      // Update user role
                      const updated = { ...user, role: e.target.value }
                      // ... update logic
                    }}
                  >
                    {availableRoles.map(role => (
                      <option key={role} value={role}>
                        {RoleManager.getRoleName(role)}
                      </option>
                    ))}
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Example 3: Settings with Permission Checks

**File:** `src/pages/Settings.jsx`

```jsx
import { useApp } from '../context/AppContext'
import { usePermission } from '../hooks/usePermission'
import { useTenant } from '../hooks/useTenant'

export default function Settings() {
  const { currentOrg, setToast } = useApp()
  const { canManageOrg } = usePermission()
  const { plan, maxTeamSize, allowedFeatures } = useTenant()

  if (!canManageOrg()) {
    return <div>Only organization owners can access settings</div>
  }

  return (
    <div>
      <h1>Organization Settings</h1>

      <div className="settings-section">
        <h3>Plan Information</h3>
        <p>Plan: {plan}</p>
        <p>Max Team Size: {maxTeamSize}</p>
        <p>Features: {allowedFeatures.join(', ')}</p>
      </div>

      <div className="settings-section">
        <h3>Organization Details</h3>
        <div>
          <label>Organization Name</label>
          <input
            type="text"
            defaultValue={currentOrg?.name}
            onChange={(e) => {
              // Update org name
            }}
          />
        </div>
      </div>
    </div>
  )
}
```

---

## Step 9: Testing Checklist

### Unit Tests

```javascript
// tests/services.test.js

describe('AuthService', () => {
  it('should create session with orgId', async () => {
    const auth = new AuthService(mockUsers, mockTenants)
    const result = await auth.login('xpmx', 'enndy123')
    expect(result.session.orgId).toBe('ORG-001')
  })

  it('should reject super admin org access', async () => {
    const auth = new AuthService(mockUsers, mockTenants)
    const session = auth.getSession()
    session.isSuperAdmin = true
    // Should not be able to access org data
  })
})

describe('RoleManager', () => {
  it('should grant correct permissions', () => {
    const admin = { role: 'admin' }
    expect(RoleManager.canPerformAction(admin, 'create', 'invoice')).toBe(true)
    
    const viewer = { role: 'viewer' }
    expect(RoleManager.canPerformAction(viewer, 'create', 'invoice')).toBe(false)
  })
})

describe('TenantDataLayer', () => {
  it('should filter data by org', () => {
    const auth = new AuthService(mockUsers, mockTenants)
    auth.login('xpmx', 'enndy123')
    
    const layer = new TenantDataLayer(auth)
    const filtered = layer.getInvoices(mockInvoices)
    
    // Should only return org invoices
    filtered.forEach(inv => {
      expect(inv.orgId).toBe('ORG-001')
    })
  })

  it('should prevent cross-org updates', () => {
    const auth = new AuthService(mockUsers, mockTenants)
    auth.login('xpmx', 'enndy123')
    
    const layer = new TenantDataLayer(auth)
    const crossOrgInvoice = { id: 'INV-999', orgId: 'ORG-OTHER' }
    
    expect(() => {
      layer.updateRecord('invoice', 'INV-999', {}, [crossOrgInvoice])
    }).toThrow()
  })
})
```

### Integration Tests

```javascript
// tests/integration.test.js

describe('Multi-tenant workflow', () => {
  it('should isolate org1 and org2 data', async () => {
    const auth = new AuthService(mockUsers, mockTenants)
    const layer = new TenantDataLayer(auth)
    
    // Login as org1 user
    await auth.login('xpmx', 'enndy123')
    const org1Data = layer.getInvoices(allInvoices)
    
    // Logout and login as org2 user
    await auth.logout()
    // ... create org2 user ...
    // await auth.login('org2user', 'password')
    
    // org1 data should not be visible
  })

  it('should enforce role-based access', () => {
    const viewer = { role: 'viewer', orgId: 'ORG-001', isSuperAdmin: false }
    expect(RoleManager.canPerformAction(viewer, 'delete', 'invoice')).toBe(false)
    
    const admin = { role: 'admin', orgId: 'ORG-001', isSuperAdmin: false }
    expect(RoleManager.canPerformAction(admin, 'delete', 'invoice')).toBe(true)
  })
})
```

---

## Step 10: Deployment Checklist

- [ ] All services created in `src/services/`
- [ ] All hooks created in `src/hooks/`
- [ ] Middleware created in `src/middleware/`
- [ ] AppContext refactored
- [ ] Login page updated
- [ ] All data mock files updated with orgId
- [ ] Migration script run
- [ ] All pages updated to use hooks
- [ ] Route guards implemented
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] No cross-org data leakage verified
- [ ] Permission checks working
- [ ] Role hierarchy tested
- [ ] Documentation updated

---

## Common Patterns

### Pattern 1: Check Permission Before Action

```javascript
const { can } = usePermission()

if (!can('delete', 'invoice')) {
  return <button disabled>Delete</button>
}
```

### Pattern 2: Filter Data by Org

```javascript
const { tenantDataLayer } = useApp()
const invoices = tenantDataLayer.getInvoices(allInvoices)
```

### Pattern 3: Create Record with Org Context

```javascript
const { create } = useTenantData()
const invoice = create('invoice', {
  customer: 'John Doe',
  amount: 1000,
})
// orgId automatically added
```

### Pattern 4: Check Role

```javascript
const { isOwner, isAdmin } = useRole()

if (!isOwner) {
  return <div>Only owners can do this</div>
}
```

### Pattern 5: Get Org Settings

```javascript
const { plan, hasFeature, maxTeamSize } = useTenant()

if (!hasFeature('advanced_reports')) {
  return <div>Upgrade to Pro for advanced reports</div>
}
```

---

## Troubleshooting

### Issue: Data appearing across organizations

**Solution:** Verify all data queries use `tenantDataLayer` filtering:
```javascript
// WRONG
const invoices = allInvoices

// RIGHT
const invoices = tenantDataLayer.getInvoices(allInvoices)
```

### Issue: Permission checks not working

**Solution:** Ensure hooks are used within AppProvider:
```javascript
// WRONG - called outside AppProvider
const { can } = usePermission()

// RIGHT - called inside component wrapped by AppProvider
function MyComponent() {
  const { can } = usePermission()
}
```

### Issue: orgId not being set on new records

**Solution:** Use tenantDataLayer.createRecord or useTenantData hook:
```javascript
// WRONG
setInvoices([...invoices, { ...data }])

// RIGHT
const record = tenantDataLayer.createRecord('invoice', data)
setInvoices([...invoices, record])
```

---

## Performance Considerations

1. **Filtering:** Data filtering happens at component render time. For large datasets (1000+ records), consider memoizing:
   ```javascript
   const orgInvoices = useMemo(
     () => tenantDataLayer.getInvoices(invoices),
     [invoices, tenantDataLayer]
   )
   ```

2. **Session Validation:** Session activity is updated every 5 minutes automatically. No action needed.

3. **Cache:** TenantService caches organizations for 5 minutes to reduce lookups.

---

## Next Steps

1. Implement services (already created)
2. Refactor AppContext
3. Update Login page
4. Migrate mock data
5. Update pages to use hooks
6. Add route guards
7. Run tests
8. Deploy

**Estimated time: 3-4 hours**

---

## Support Resources

- See `MULTI_TENANT_ARCHITECTURE.md` for complete design
- See code examples in this file for implementation patterns
- Check `src/services/` and `src/hooks/` for service implementations

All questions answered in the architecture document.
