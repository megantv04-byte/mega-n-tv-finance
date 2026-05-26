# Quick Start: Testing Multi-Tenant System

## 🚀 Start Here

You're about to test the new multi-tenant architecture. This should take **5-10 minutes**.

## Step 1: Start the Development Server

```bash
cd /path/to/financeflow
npm run dev
```

Wait for the message: `Local: http://localhost:5173/`

## Step 2: Open DevTools

Press **F12** (or `Ctrl+Shift+I` on Windows/Linux, `Cmd+Option+I` on Mac)

Go to **Console** tab (you'll be using this to verify things)

## Step 3: Test Super Admin Login

1. Clear localStorage first:
   ```javascript
   localStorage.clear()
   location.reload()
   ```

2. Wait for page to reload

3. Login with Super Admin credentials:
   - **Username:** `enndy`
   - **Password:** Look in `src/data/mockData.js` for mockUsers find `enndy` entry
   - Or just try common passwords like `password123` or `admin`

4. **Expected Result:**
   - ✅ Should see **"OrgManager"** in the interface
   - ✅ Should see organization list
   - ✅ Should see user management section
   - ✅ Sidebar shows "Manager" view

5. **Verify in Console:**
   ```javascript
   const session = JSON.parse(localStorage.getItem('xflow_session'))
   console.log('Super Admin Status:', session.isSuperAdmin) // Should be true
   console.log('Organization ID:', session.orgId) // Should exist (for viewing)
   ```

## Step 4: Test Organization User Login

1. Logout by clearing localStorage:
   ```javascript
   localStorage.clear()
   location.reload()
   ```

2. Login with Organization User:
   - **Username:** `belti`
   - **Password:** Check mockData.js
   - If that doesn't work, try any other non-admin user

3. **Expected Result:**
   - ✅ Should see **"Dashboard"** or normal app layout
   - ✅ Should see **Sidebar** with navigation
   - ✅ Should see their organization name (e.g., "MEGA SH TV")
   - ✅ Should NOT see OrgManager interface

4. **Verify in Console:**
   ```javascript
   const session = JSON.parse(localStorage.getItem('xflow_session'))
   console.log('Super Admin Status:', session.isSuperAdmin) // Should be false
   console.log('Organization ID:', session.orgId) // Should be specific org like "ORG-001"
   ```

## Step 5: Test Data Isolation

Still logged in as organization user (belti), run in console:

```javascript
// Check your accessible data
const session = JSON.parse(localStorage.getItem('xflow_session'))
const invoices = JSON.parse(localStorage.getItem('xflow_invoices') || '[]')

console.log('=== DATA ISOLATION TEST ===')
console.log('Your Org:', session.orgId)
console.log('Total Invoices Loaded:', invoices.length)

// Count invoices by org
const byOrg = {}
invoices.forEach(inv => {
  const org = inv.orgId || 'NONE'
  byOrg[org] = (byOrg[org] || 0) + 1
})

console.log('Invoices by Organization:', byOrg)
console.log('Your Org Invoices:', byOrg[session.orgId] || 0)
```

**Expected Result:**
- ✅ You should only see invoices from your org
- ✅ If data migration ran, all invoices should have orgId
- ✅ No data from other organizations visible

## Step 6: Test Session Persistence

Still logged in, do this:

1. **Refresh the page** (press F5 or Ctrl+R)

2. **Expected Result:**
   - ✅ You should stay logged in
   - ✅ Page should NOT redirect to login
   - ✅ Same data should be visible

3. **Verify Session Still Exists:**
   ```javascript
   const session = localStorage.getItem('xflow_session')
   console.log('Session Exists After Reload:', !!session)
   ```

## Step 7: Run Full Diagnostics

For a complete system check, run this in the console:

```javascript
(async () => {
  // Try to import the debug utility
  try {
    // If the import works directly
    const { MultiTenantDebug } = await import('./src/utils/MultiTenantDebug.js')
    MultiTenantDebug.runFullDiagnostics()
  } catch (e) {
    // Fallback: use the built-in checks
    console.log('=== QUICK DIAGNOSTICS ===')
    
    const session = localStorage.getItem('xflow_session')
    const user = localStorage.getItem('xflow_user')
    
    console.log('Session exists:', !!session)
    console.log('User exists:', !!user)
    
    if (session) {
      const s = JSON.parse(session)
      console.log('Super Admin:', s.isSuperAdmin)
      console.log('Org:', s.orgId)
      console.log('User:', s.username)
    }
  }
})()
```

## 🎯 Success Criteria

You should see:
- ✅ Super admin sees OrgManager
- ✅ Org user sees App layout
- ✅ Session persists after reload
- ✅ Data isolation working (only see own org)
- ✅ No console errors
- ✅ Proper organization in UI

## ❌ If Something's Wrong

### Super admin not seeing OrgManager
- Check console for errors
- Verify user.isSuperAdmin is true in mockData
- Try logging out and back in
- Clear localStorage and reload

### Regular user seeing OrgManager
- Verify user.isSuperAdmin is false in mockData
- Check session.isSuperAdmin in console
- This shouldn't happen - report as bug

### Still seeing other org data
- Check if data migration has run (look for `[DataMigration]` in console)
- Verify invoices have orgId fields
- Try reloading page
- Clear localStorage and reload

### Session lost after reload
- Check if xflow_session exists in localStorage
- Verify session structure is valid JSON
- Look for console errors
- Check if app is properly initializing TenantContext

## 📞 Need Help?

### Check These First
1. **Console for errors:** F12 → Console tab → look for red errors
2. **Session status:** Run session check commands above
3. **Docs:** Read MULTI_TENANT_TESTING_GUIDE.md for detailed tests

### Common Commands

```javascript
// Check everything
const s = JSON.parse(localStorage.getItem('xflow_session'))
const u = localStorage.getItem('xflow_user')
console.log('Session:', s, 'User:', u)

// Force logout
localStorage.clear(); location.reload()

// Check Invoices have orgId
const inv = JSON.parse(localStorage.getItem('xflow_invoices') || '[]')
console.log('Invoices with orgId:', inv.filter(i => i.orgId).length, '/', inv.length)
```

## 📋 Next After Testing

If all tests pass:
1. **✅ Success!** The multi-tenant system is working
2. **→ Next:** Look at MULTI_TENANT_TESTING_GUIDE.md for more detailed tests
3. **→ Then:** Review MULTI_TENANT_IMPLEMENTATION.md for architecture details

If you find issues:
1. Check troubleshooting section above
2. Review console logs
3. Check MULTI_TENANT_IMPLEMENTATION.md troubleshooting section
4. Debug using console commands

---

**Estimated Time:** 5-10 minutes
**Status:** Ready to test now! 🚀

Start the dev server and begin with Step 1.
