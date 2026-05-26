/**
 * Organization Feature Configuration
 * Centralized feature flags per organization
 *
 * Rules:
 * - MEGA SH TV: Full access to all features
 * - Other organizations: Limited access per configuration
 */

export interface OrganizationFeatureFlags {
  suppliers: boolean
  partnerSettlement: boolean
  depositAccounts: boolean
  partnerExpenseAccount: boolean
}

export const organizationFeatures: Record<string, OrganizationFeatureFlags> = {
  // MEGA SH TV - Full access
  'ORG-001': {
    suppliers: true,
    partnerSettlement: true,
    depositAccounts: true,
    partnerExpenseAccount: true,
  },

  // Default for all other organizations - Limited access
  default: {
    suppliers: false,
    partnerSettlement: false,
    depositAccounts: false,
    partnerExpenseAccount: false,
  },
}

/**
 * Get feature flags for an organization
 * Falls back to default if organization not found
 */
export function getOrganizationFeatures(orgId: string): OrganizationFeatureFlags {
  return organizationFeatures[orgId] || organizationFeatures.default
}

/**
 * Check if feature is enabled for organization
 */
export function isFeatureEnabled(
  orgId: string,
  feature: keyof OrganizationFeatureFlags
): boolean {
  const features = getOrganizationFeatures(orgId)
  return features[feature] ?? false
}
