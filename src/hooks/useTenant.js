import { useMemo } from 'react'
import { useApp } from '../context/AppContext'

/**
 * Hook for tenant/organization context
 *
 * Usage:
 *   const { org, orgId, hasFeature, plan } = useTenant()
 */
export function useTenant() {
  const { currentOrg, currentUser, tenantService } = useApp()

  return useMemo(() => ({
    /**
     * Get current organization
     */
    org: currentOrg,

    /**
     * Get current organization ID
     */
    orgId: currentUser?.orgId,

    /**
     * Get organization name
     */
    orgName: currentOrg?.name,

    /**
     * Get organization short name
     */
    orgShortName: currentOrg?.shortName,

    /**
     * Get tenant settings
     */
    settings: currentOrg
      ? tenantService.getTenantSettings(currentOrg.id)
      : null,

    /**
     * Check if organization has feature
     */
    hasFeature: (feature) => {
      if (!currentOrg) return false
      const features = currentOrg.metadata?.features || []
      return features.includes(feature) || features.includes('all')
    },

    /**
     * Get organization plan
     */
    plan: currentOrg?.plan,

    /**
     * Check if organization is active
     */
    isActive: currentOrg?.status === 'active',

    /**
     * Get organization color
     */
    color: currentOrg?.color,

    /**
     * Get max team size for plan
     */
    maxTeamSize: currentOrg?.metadata?.maxUsers,

    /**
     * Get allowed features for org
     */
    allowedFeatures: currentOrg?.metadata?.features || [],

    /**
     * Check if org is multi-currency enabled
     */
    isMultiCurrency: currentOrg?.plan === 'pro' || currentOrg?.plan === 'enterprise',

    /**
     * Check if org is multi-language enabled
     */
    isMultiLanguage: currentOrg?.plan === 'enterprise',

    /**
     * Get organization creation date
     */
    createdAt: currentOrg?.createdAt,
  }), [currentOrg, currentUser, tenantService])
}
