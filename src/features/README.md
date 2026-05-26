# Organization-Based Feature Control System

Complete production-ready feature management system for multi-tenant SaaS applications.

## Overview

This system provides centralized, organization-level feature flags that control access to specific modules, fields, and reports based on the current organization.

### Organizations & Access Levels

- **MEGA SH TV** (`ORG-001`): Full access to all features
- **All Other Organizations**: Limited access per feature configuration

## Architecture

```
src/features/
├── organizationFeatures.ts    # Feature flag configuration per organization
├── featureService.ts          # Core service for checking feature availability
├── useFeatures.ts             # React hook for component-level access
├── FeatureGate.jsx            # Conditional rendering components
├── routeGuards.ts             # Route protection logic
└── index.ts                   # Main export barrel
```

## Features Controlled

### 1. **Suppliers Module** (`suppliers`)
- **MEGA SH TV**: Visible in sidebar, fully accessible
- **Others**: Hidden from sidebar, `/suppliers` route blocked
- **Files**: `src/components/Sidebar.jsx`, `src/middleware/featureRouteGuard.ts`

### 2. **Partner Settlement Report** (`partnerSettlement`)
- **MEGA SH TV**: Tab visible in Reports
- **Others**: Tab hidden from Reports menu
- **Files**: `src/pages/Reports.jsx`

### 3. **Deposit Accounts** (`depositAccounts`)
- **MEGA SH TV**: Fields visible and functional in Payment registration
- **Others**: Fields hidden from form
- **Fields Hidden**:
  - "Depozituar te" (Deposit Account Selection)
  - "Depozituar tek" (Deposited To Partner)
- **Files**: `src/pages/PaymentModal.jsx`

### 4. **Partner Expense Fields** (`partnerExpenseAccount`)
- **MEGA SH TV**: Fields visible in Expense form
- **Others**: Fields hidden from form
- **Fields Hidden**:
  - "Nga cila llogari u pagua" (Paid From Account)
  - "Nga cili partner u bë shpenzimi" (Partner Who Made Expense)
- **Files**: `src/pages/Expenses.jsx`

## Usage

### 1. In React Components

```jsx
import { useFeatures } from '../features/useFeatures'

export function MyComponent() {
  const {
    canAccessSuppliers,
    canUseDepositAccounts,
    canUsePartnerSettlement,
    canUsePartnerExpenseFields,
  } = useFeatures()

  return (
    <>
      {canAccessSuppliers && (
        <SuppliersList />
      )}
      
      {canUseDepositAccounts && (
        <DepositAccountField />
      )}
    </>
  )
}
```

### 2. Using FeatureGate Component

```jsx
import { FeatureGate, FeatureFieldGate } from '../features/FeatureGate'

export function Form() {
  return (
    <>
      {/* Hide completely if feature not available */}
      <FeatureGate feature="suppliers">
        <SuppliersTable />
      </FeatureGate>

      {/* Show but disable if feature not available */}
      <FeatureFieldGate feature="depositAccounts">
        <DepositAccountInput />
      </FeatureFieldGate>
    </>
  )
}
```

### 3. In Services (Backend)

```ts
import { featureService } from '../features/featureService'

export class PaymentService {
  createPayment(orgId: string, data: PaymentData) {
    // Validate feature access
    featureService.validateFeatureAccess(orgId, 'depositAccounts')
    
    // Process payment with deposit fields
    return this.save(data)
  }
}
```

### 4. Route Protection

Routes are automatically protected through the `navigate()` function in AppContext:

```tsx
// Attempting to navigate to /suppliers with restricted org
navigate('suppliers')
// → Shows error toast
// → Redirects to /dashboard
// → Prevents navigation
```

## Configuration

### Adding a New Feature

1. **Update `organizationFeatures.ts`**:

```ts
export const organizationFeatures: Record<string, OrganizationFeatureFlags> = {
  'ORG-001': {
    myNewFeature: true,
  },
  default: {
    myNewFeature: false,
  },
}
```

2. **Add to `OrganizationFeatureFlags` interface**:

```ts
export interface OrganizationFeatureFlags {
  myNewFeature: boolean
}
```

3. **Add check method to `FeatureService`**:

```ts
static canUseMyNewFeature(orgId: string): FeatureCheckResult {
  const allowed = isFeatureEnabled(orgId, 'myNewFeature')
  return {
    allowed,
    reason: !allowed ? 'My new feature not available' : undefined,
  }
}
```

4. **Add hook property to `useFeatures`**:

```ts
const myNewFeatureCheck = FeatureService.canUseMyNewFeature(currentOrgId)
// Then return in hook result
canUseMyNewFeature: myNewFeatureCheck.allowed,
```

### Enabling Feature for Organization

```ts
organizationFeatures['ORG-002'] = {
  suppliers: false,
  partnerSettlement: false,
  depositAccounts: false,
  partnerExpenseAccount: false,
}

// To enable a feature for this org:
organizationFeatures['ORG-002'].suppliers = true
```

## Security Considerations

### Frontend (UI Level)
- ✅ Sidebar menu filtering
- ✅ Component conditional rendering
- ✅ Route blocking with redirect
- ✅ Form field visibility control

### Backend (Service Level)
- ✅ `featureService.validateFeatureAccess()` in service methods
- ✅ Should validate in API endpoints before processing
- ✅ Should validate in database repositories
- ✅ Prevents unauthorized feature use if UI is bypassed

### Implementation Requirement

Always validate feature access at multiple levels:

```ts
// Service method
async createPayment(orgId: string, payment: PaymentData) {
  // Level 1: Service validation
  featureService.validateFeatureAccess(orgId, 'depositAccounts')
  
  // Level 2: Repository validation
  await this.repo.createPayment(orgId, payment)
}

// Repository method
async createPayment(orgId: string, payment: PaymentData) {
  // Level 3: Database validation
  const features = getOrganizationFeatures(orgId)
  if (!features.depositAccounts && payment.depositedTo) {
    throw new Error('Feature not available')
  }
  
  return this.db.insert('payments', payment)
}
```

## File Modifications Summary

| File | Changes | Type |
|------|---------|------|
| `Sidebar.jsx` | Added feature-based menu filtering for suppliers | UI |
| `PaymentModal.jsx` | Hide deposit account fields based on features | UI |
| `Expenses.jsx` | Hide partner expense fields based on features | UI |
| `Reports.jsx` | Filter partner settlement tab from menu | UI |
| `AppContext.jsx` | Added route guard in navigate function | Logic |
| `featureRouteGuard.ts` | Route protection middleware (NEW) | Core |

## Testing Features

### Unit Test Example

```ts
import { FeatureService } from '../features/featureService'

describe('FeatureService', () => {
  it('allows suppliers access for MEGA SH TV', () => {
    const result = FeatureService.canAccessSuppliers('ORG-001')
    expect(result.allowed).toBe(true)
  })

  it('denies suppliers access for other orgs', () => {
    const result = FeatureService.canAccessSuppliers('ORG-002')
    expect(result.allowed).toBe(false)
  })
})
```

### Component Test Example

```tsx
import { render, screen } from '@testing-library/react'
import { MyComponent } from './MyComponent'
import * as AppContext from '../context/AppContext'

it('shows suppliers list when feature enabled', () => {
  jest.spyOn(AppContext, 'useApp').mockReturnValue({
    currentOrgId: 'ORG-001',
    // ... other props
  })

  render(<MyComponent />)
  expect(screen.getByText('Suppliers')).toBeInTheDocument()
})
```

## Troubleshooting

### Feature Not Appearing

1. Check organization ID is correct
2. Verify feature flag is enabled in `organizationFeatures.ts`
3. Check that `useFeatures()` hook is being called
4. Verify conditional rendering is correct

### Route Blocking Not Working

1. Check that `featureRouteGuard.ts` is imported in AppContext
2. Verify route is in `routeFeatureMap`
3. Check that feature service method exists
4. Ensure navigate function is being called (not direct route change)

## Best Practices

1. **Always use useFeatures hook** in components instead of hardcoding checks
2. **Never hardcode organization IDs** - use `currentOrgId` from context
3. **Validate at multiple levels** - UI, service, and data layer
4. **Use consistent naming** - feature names should match file/component names
5. **Document restricted features** - clearly mark which features require specific organizations
6. **Test feature gates** - ensure both enabled and disabled states work
7. **Log access denials** - use `logAccessDenial()` for auditing

## Future Enhancements

- [ ] Role-based feature overrides
- [ ] Temporary feature access (time-limited)
- [ ] Feature upgrade workflows
- [ ] Analytics on feature usage per organization
- [ ] Gradual rollout/feature flags for new features
- [ ] A/B testing based on features

---

**Last Updated**: May 26, 2026
**Status**: Production Ready ✅
