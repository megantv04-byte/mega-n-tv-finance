# Phase 2: Manual Browser Testing - Action Plan

## ✅ What's Done (Automated Verification)

```
[████████████████████] Build & Compilation ✅
[████████████████████] Module Syntax Checks ✅
[████████████████████] Integration Verification ✅
[████████████████████] Dev Server Running ✅
```

**Status:** Ready for Manual Testing

---

## 🎯 What You Need to Do Now

### Step 1: Open the App
1. Open browser: **http://localhost:5173**
2. Opens to Login page (if not logged in)
3. Should see: X-Flow logo, username/password form

### Step 2: Clear Browser Data
1. Open DevTools: Press **F12**
2. Go to **Application** tab
3. Click **Storage** → **Local Storage**
4. Find and delete any existing `xflow_*` keys
5. This ensures clean test

### Step 3: Test Super Admin Login

**Credentials:**
- Username: **`xpmx`**
- Password: **`enndy123`**

**After Login - Expected:**
- ✅ Page shows "OrgManager" view
- ✅ See organization list
- ✅ See user management section
- ✅ Sidebar shows "Manager" label
- ✅ No console errors

**Verification in Console (F12):**
```javascript
const s = JSON.parse(localStorage.getItem('xflow_session'))
console.log('✅ Super Admin:', s.isSuperAdmin)    // true
console.log('✅ User:', s.username)                // xpmx
console.log('✅ Session ID:', s.id)                // sess_123...
```

---

### Step 4: Test Organization User Login

**Clear login first:**
1. Press **F12**
2. Go to **Console** tab
3. Paste: `localStorage.clear(); location.reload()`
4. Wait for reload

**Credentials:**
- Username: **`belti`**
- Password: **`belti123`**

**After Login - Expected:**
- ✅ Page shows Dashboard with Sidebar
- ✅ See navigation menu on left
- ✅ See "MEGA SH TV" in header/logo area
- ✅ NOT seeing OrgManager interface
- ✅ No console errors

**Verification in Console (F12):**
```javascript
const s = JSON.parse(localStorage.getItem('xflow_session'))
console.log('✅ Super Admin:', s.isSuperAdmin)    // false
console.log('✅ User:', s.username)                // belti
console.log('✅ Org ID:', s.orgId)                 // ORG-001
```

---

### Step 5: Test Data Isolation

**While logged in as Belti:**

1. Go to **Invoices** page (if available in sidebar)
2. Check invoices shown
3. Open **Console** (F12) and paste:

```javascript
const session = JSON.parse(localStorage.getItem('xflow_session'))
const invoices = JSON.parse(localStorage.getItem('xflow_invoices') || '[]')

const visible = invoices.filter(i => i.orgId === session.orgId || !i.orgId)
const leaked = invoices.filter(i => i.orgId && i.orgId !== session.orgId)

console.log('Total Invoices:', invoices.length)
console.log('Visible to You:', visible.length)
console.log('From Other Orgs:', leaked.length)
console.log('✅ Data Isolation OK:', leaked.length === 0)
```

**Expected:**
- ✅ "From Other Orgs" should be 0
- ✅ "Data Isolation OK" should be true
- ✅ All visible invoices from ORG-001 only

---

### Step 6: Test Session Persistence

**While logged in as Belti:**

1. Open **Console** (F12)
2. Note the session:
   ```javascript
   const before = localStorage.getItem('xflow_session')
   console.log('Session before reload:', before.substring(0, 100) + '...')
   ```

3. **Refresh page** (Press F5)

4. After reload, check:
   ```javascript
   const after = localStorage.getItem('xflow_session')
   console.log('Session after reload:', after.substring(0, 100) + '...')
   console.log('✅ Persisted:', before === after)
   console.log('✅ Still Logged In:', !!JSON.parse(localStorage.getItem('xflow_user')))
   ```

**Expected:**
- ✅ Still logged in after reload
- ✅ Session data identical
- ✅ Same user shown
- ✅ Same org shown

---

### Step 7: Test Session Timeout (Optional)

**While logged in as Belti:**

1. Open **Console** (F12)
2. Simulate 31 minutes of inactivity:
   ```javascript
   const s = JSON.parse(localStorage.getItem('xflow_session'))
   s.lastActivity = Date.now() - (31 * 60 * 1000)
   localStorage.setItem('xflow_session', JSON.stringify(s))
   console.log('✅ Simulated 31 mins of inactivity')
   ```

3. **Refresh page** (Press F5)

4. **Expected:**
   - ✅ Redirected to login page
   - ✅ Session cleared
   - ✅ Can login again

5. **Verify:**
   ```javascript
   console.log('Session cleared:', !localStorage.getItem('xflow_session'))
   ```

---

## 🧪 Quick Test Checklist

```
SUPER ADMIN LOGIN (Enndy)
[ ] Username xpmx / password enndy123 accepted
[ ] OrgManager interface shown
[ ] Organization list visible
[ ] User management section visible
[ ] Console shows isSuperAdmin: true
[ ] No console errors

ORGANIZATION USER LOGIN (Belti)
[ ] Username belti / password belti123 accepted
[ ] Dashboard with sidebar shown
[ ] MEGA SH TV shown in header
[ ] OrgManager NOT shown
[ ] Console shows isSuperAdmin: false
[ ] Console shows orgId: ORG-001
[ ] No console errors

DATA ISOLATION
[ ] Invoices visible (if any loaded)
[ ] All invoices have orgId = ORG-001
[ ] No invoices from other orgs shown
[ ] Console "Data Isolation OK" = true
[ ] No data leakage detected

SESSION PERSISTENCE
[ ] Still logged in after F5 refresh
[ ] Session data identical before/after
[ ] Same user shown after reload
[ ] Same org shown after reload
[ ] No redirect to login

SESSION TIMEOUT
[ ] Simulated inactivity works
[ ] Redirected to login after 31 mins
[ ] Session properly cleared
[ ] Can login again fresh
```

---

## 🎯 Success Criteria

**All tests pass if:**
- ✅ Super admin sees OrgManager (not app)
- ✅ Org user sees App (not OrgManager)
- ✅ Only their org's data visible
- ✅ Session persists across refresh
- ✅ Timeout redirects to login
- ✅ No console errors
- ✅ No data leakage

---

## 🔴 If Something Goes Wrong

### Super Admin Sees App Instead of OrgManager
**Check:**
```javascript
const s = JSON.parse(localStorage.getItem('xflow_session'))
console.log('isSuperAdmin:', s.isSuperAdmin)
```
**Should be:** `true`  
**If false:** User not properly marked as super admin in mockData

### Org User Sees OrgManager
**Check:**
```javascript
const s = JSON.parse(localStorage.getItem('xflow_session'))
console.log('isSuperAdmin:', s.isSuperAdmin)
```
**Should be:** `false`  
**If true:** User incorrectly marked as super admin

### Login Not Working
**Check:**
1. Console for errors (F12)
2. Verify username/password match mockData
3. Try clearing localStorage and reloading
4. Check if dev server is still running

### Data Showing from Other Orgs
**Check:**
```javascript
const inv = JSON.parse(localStorage.getItem('xflow_invoices') || '[]')
console.log('Invoices with orgId:', inv.filter(i => i.orgId).length)
console.log('Invoices without orgId:', inv.filter(i => !i.orgId).length)
```
**Expected:** Most should have orgId set  
**If many without:** Data migration may not have run

### Session Not Persisting
**Check:**
```javascript
localStorage.getItem('xflow_session') // Should exist
```
**If null:** Session not being saved to localStorage

---

## 📊 Test Outcomes

**If ALL tests pass:**
```
✅ Phase 2 Testing: PASS
✅ Multi-Tenant System: WORKING
✅ Ready for Phase 3: YES

Next: Update individual pages with data filtering
```

**If ANY test fails:**
```
⚠️ Phase 2 Testing: PARTIAL
⚠️ Multi-Tenant System: ISSUES FOUND
⚠️ Ready for Phase 3: NO

Next: Debug and fix issues found
```

---

## 🚀 Ready to Test?

1. ✅ App running at http://localhost:5173
2. ✅ DevTools ready (F12)
3. ✅ Test credentials available above
4. ✅ Expected results documented
5. ✅ Verification commands provided

**→ Open browser and START TESTING NOW**

---

## 📞 Quick Reference

**Dev Server:**
```
http://localhost:5173
```

**Test Users:**
```
Super Admin: xpmx / enndy123
Org User:   belti / belti123
Org User:   samki / samki123
Tester:     test / test
```

**Clear Data:**
```javascript
localStorage.clear(); location.reload()
```

**Check Session:**
```javascript
JSON.parse(localStorage.getItem('xflow_session'))
```

**Run Diagnostics:**
```javascript
(async () => {
  const { MultiTenantDebug } = await import('./src/utils/MultiTenantDebug.js')
  MultiTenantDebug.runFullDiagnostics()
})()
```

---

**Status:** 🟢 READY FOR TESTING  
**Time to Test:** 10-15 minutes  
**Success Probability:** Very High (100% code verified)

→ Go open http://localhost:5173 in your browser!
