/**
 * useFeatures Hook
 * Custom React hook for accessing feature availability in components
 * Based on current organization context
 */

import { useApp } from '../context/AppContext'
import { FeatureService } from './featureService'

export interface UseFeaturesResult {
  // Feature availability checks
  canAccessSuppliers: boolean
  canUseDepositAccounts: boolean
  canUsePartnerSettlement: boolean
  canUsePartnerExpenseFields: boolean

  // Get reason if feature is disabled
  getDisabledReason: (feature: string) => string | undefined

  // Check any feature dynamically
  isFeatureEnabled: (feature: keyof ReturnType<typeof FeatureService.getAvailableFeatures>) => boolean
}

/**
 * Hook to check feature availability for current organization
 * Usage in components:
 * const { canAccessSuppliers, canUseDepositAccounts } = useFeatures()
 */
export function useFeatures(): UseFeaturesResult {
  const { currentOrgId } = useApp()

  if (!currentOrgId) {
    return {
      canAccessSuppliers: false,
      canUseDepositAccounts: false,
      canUsePartnerSettlement: false,
      canUsePartnerExpenseFields: false,
      getDisabledReason: () => 'No organization selected',
      isFeatureEnabled: () => false,
    }
  }

  const suppliersCheck = FeatureService.canAccessSuppliers(currentOrgId)
  const depositCheck = FeatureService.canUseDepositAccounts(currentOrgId)
  const settlementCheck = FeatureService.canUsePartnerSettlement(currentOrgId)
  const expenseFieldsCheck = FeatureService.canUsePartnerExpenseFields(currentOrgId)

  return {
    canAccessSuppliers: suppliersCheck.allowed,
    canUseDepositAccounts: depositCheck.allowed,
    canUsePartnerSettlement: settlementCheck.allowed,
    canUsePartnerExpenseFields: expenseFieldsCheck.allowed,

    getDisabledReason: (feature: string) => {
      switch (feature) {
        case 'suppliers':
          return suppliersCheck.reason
        case 'depositAccounts':
          return depositCheck.reason
        case 'partnerSettlement':
          return settlementCheck.reason
        case 'partnerExpenseFields':
          return expenseFieldsCheck.reason
        default:
          return undefined
      }
    },

    isFeatureEnabled: (feature) => {
      const features = FeatureService.getAvailableFeatures(currentOrgId)
      return features[feature] ?? false
    },
  }
}
