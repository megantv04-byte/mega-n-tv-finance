# Multi-Tenant System Testing Guide

## Quick Verification Steps

### 1. Open Browser Console
Press `F12` or `Ctrl+Shift+I` to open Developer Tools → Console tab

### 2. Run Diagnostics
Paste this into the console:
```javascript
import('./src/utils/MultiTenantDebug.js').then(m => {
  m.MultiTenantDebug.runFullDiagnostics()
})
```

Or use the shorthand in the app console:
```javascript
// After app loads, you can use:
window.__MultiTenantDebug = async () => {
  const { MultiTenantDebug } = await import('./src/utils/MultiTenantDebug.js')
  MultiTenantDebug.runFullDiagnostics()
}
window.__MultiTenantDebug()
```

## Test Scenarios

### Scenario 1: Super Admin Login
```
Step 1: Clear localStorage
  → Open DevTools → Application → Storage → localStorage
  → Delete xflow_session and xflow_user

Step 2: Login
  Username: enndy
  Password: [see mockUsers in mockData.js]

Expected Result:
  ✅ Session created with isSuperAdmin: true
  ✅ Redirected to OrgManager page
  ✅ Console shows: "✅ Super Admin → Should show OrgManager"
```

### Scenario 2: Organization User Login
```
Step 1: Clear localStorage again
  → Same as above

Step 2: Login
  Username: belti (or any non-admin user)
  Password: [see mockUsers]

Expected Result:
  ✅ Session created with orgId: "ORG-001" (or user's org)
  ✅ Redirected to App layout with Sidebar
  ✅ Console shows: "✅ Org User → Should show App Layout"
```

### Scenario 3: Data Isolation Test
```
Step 1: Login as belti (org user)
  
Step 2: Open DevTools → Console

Step 3: Run this code:
  const session = JSON.parse(localStorage.getItem('xflow_session'))
  const invoices = JSON.parse(localStorage.getItem('xflow_invoices') || '[]')
  
  console.log('Your Org:', session.orgId)
  console.log('Total Invoices:', invoices.length)
  
  const yourOrgInvoices = invoices.filter(i => 
    i.orgId === session.orgId || !i.orgId
  )
  const otherOrgInvoices = invoices.filter(i => 
    i.orgId && i.orgId !== session.orgId
  )
  
  console.log('Your Org Invoices:', yourOrgInvoices.length)
  console.log('Other Org Invoices (should be 0):', otherOrgInvoices.length)

Expected Result:
  ✅ yourOrgInvoices > 0
  ✅ otherOrgInvoices = 0 (or small due to migration)
```

### Scenario 4: Session Persistence
```
Step 1: Login as any user

Step 2: Note the session in localStorage
  → DevTools → Application → Storage → localStorage → xflow_session

Step 3: Refresh the page (Ctrl+R or F5)

Expected Result:
  ✅ Page refreshes
  ✅ User remains logged in
  ✅ Session data intact in localStorage
  ✅ App layout still visible (not redirected to login)
```

### Scenario 5: Session Timeout (30 minutes)
```
Step 1: Login and note the timestamp in console

Step 2: Open DevTools → Console

Step 3: Manually set lastActivity to 31 minutes ago:
  const session = JSON.parse(localStorage.getItem('xflow_session'))
  session.lastActivity = Date.now() - (31 * 60 * 1000)
  localStorage.setItem('xflow_session', JSON.stringify(session))

Step 4: Refresh page

Expected Result:
  ✅ Session considered expired
  ✅ User redirected to Login
  ✅ Session cleared from localStorage

Note: This is for testing only. In production, 
actual timeout is checked by middleware.
```

## Console Commands Reference

### Check Current Session
```javascript
const session = JSON.parse(localStorage.getItem('xflow_session'))
console.table(session)
```

### Check Current User
```javascript
const user = JSON.parse(localStorage.getItem('xflow_user'))
console.table(user)
```

### Check Data Isolation Status
```javascript
const invoices = JSON.parse(localStorage.getItem('xflow_invoices') || '[]')
const session = JSON.parse(localStorage.getItem('xflow_session'))

console.log('Total Invoices:', invoices.length)
console.log('With OrgId:', invoices.filter(i => i.orgId).length)
console.log('Without OrgId:', invoices.filter(i => !i.orgId).length)
console.log('Your Org:', session.orgId)
console.log('Your Org Only:', invoices.filter(i => i.orgId === session.orgId).length)
```

### View Organizations Available
```javascript
const orgs = JSON.parse(localStorage.getItem('xflow_organizations') || '[]')
console.table(orgs.map(o => ({ id: o.id, name: o.name, plan: o.plan })))
```

### Clear Session (Force Logout)
```javascript
localStorage.removeItem('xflow_session')
localStorage.removeItem('xflow_user')
location.reload() // Reload page
```

## Debugging Data Migration

### Check Migration Status
```javascript
// After app loads with Supabase
const session = JSON.parse(localStorage.getItem('xflow_session'))
const invoices = JSON.parse(localStorage.getItem('xflow_invoices') || '[]')

const needsMigration = invoices.some(i => !i.orgId)
console.log('Data Migration Needed:', needsMigration)
console.log('Records without orgId:', 
  invoices.filter(i => !i.orgId).map(i => ({ id: i.id, name: i.title }))
)
```

### View Migration Logs
1. Open DevTools → Console
2. Look for messages starting with `[DataMigration]`
3. Example logs:
   ```
   [DataMigration] Starting migration with default orgId: ORG-001
   [DataMigration] invoices: 100/100 records updated
   [DataMigration] Migration complete
   ```

## Common Issues & Solutions

### Issue: Session is undefined
**Solution:**
1. Make sure you're logged in
2. Check localStorage has `xflow_session`
3. Try logging out and back in

### Issue: Still seeing other org data
**Solution:**
1. Check if data migration has completed
2. Look for `[DataMigration]` messages in console
3. Verify all invoices have orgId set
4. If stuck, clear localStorage and reload

### Issue: User sees OrgManager but shouldn't be super admin
**Solution:**
1. Check the user's isSuperAdmin flag in mockData
2. Look at the session object - what does isSuperAdmin show?
3. Verify user wasn't accidentally promoted

### Issue: App shows blank/loading forever
**Solution:**
1. Check console for errors
2. Verify Supabase connection (if using remote data)
3. Check localStorage isn't corrupted
4. Try clearing localStorage and refreshing

## Automated Test Commands

### Run Full Diagnostics
```javascript
(async () => {
  const { MultiTenantDebug } = await import('./src/utils/MultiTenantDebug.js')
  MultiTenantDebug.runFullDiagnostics()
})()
```

### Test Data Isolation
```javascript
(async () => {
  const { MultiTenantDebug } = await import('./src/utils/MultiTenantDebug.js')
  const session = JSON.parse(localStorage.getItem('xflow_session'))
  const invoices = JSON.parse(localStorage.getItem('xflow_invoices') || '[]')
  const result = MultiTenantDebug.testDataIsolation(
    invoices, 
    session.orgId, 
    session.isSuperAdmin
  )
  console.log('Test Passed:', result)
})()
```

## Verifying in UI

### For Super Admin
1. Login as Enndy
2. Should see "OrgManager" in page title
3. Should see organization list
4. Should see user management section
5. Should see "Manager View" toggle in sidebar

### For Organization User
1. Login as Belti (or other org user)
2. Should see "Dashboard" or normal app layout
3. Should see Sidebar with navigation
4. Should see their organization name in logo area
5. Should see only their org's data in tables

## Next Steps After Verification

If all tests pass:
1. ✅ Multi-tenant architecture is working
2. 📋 Next: Update individual pages to use MultiTenantDataLayer
3. 📋 Then: Comprehensive security testing
4. 📋 Finally: Deploy to production

If any tests fail:
1. Check console for error messages
2. Review the issue in troubleshooting section
3. Check relevant source files (see MULTI_TENANT_IMPLEMENTATION.md)
4. Debug using console commands above

---

**Testing Environment:** Development
**Last Updated:** May 26, 2026
**Status:** Ready for testing
