/**
 * Feature Service
 * Handles all feature availability checks and validations
 * Works at both frontend and service levels
 */

import { getOrganizationFeatures, isFeatureEnabled } from './organizationFeatures'

export interface FeatureCheckResult {
  allowed: boolean
  reason?: string
}

export class FeatureService {
  /**
   * Check if organization can access suppliers module
   */
  static canAccessSuppliers(orgId: string): FeatureCheckResult {
    const allowed = isFeatureEnabled(orgId, 'suppliers')
    return {
      allowed,
      reason: !allowed ? 'Suppliers module not available for this organization' : undefined,
    }
  }

  /**
   * Check if organization can use deposit account fields
   */
  static canUseDepositAccounts(orgId: string): FeatureCheckResult {
    const allowed = isFeatureEnabled(orgId, 'depositAccounts')
    return {
      allowed,
      reason: !allowed ? 'Deposit accounts not available for this organization' : undefined,
    }
  }

  /**
   * Check if organization can use partner settlement report
   */
  static canUsePartnerSettlement(orgId: string): FeatureCheckResult {
    const allowed = isFeatureEnabled(orgId, 'partnerSettlement')
    return {
      allowed,
      reason: !allowed ? 'Partner settlement not available for this organization' : undefined,
    }
  }

  /**
   * Check if organization can use partner expense account fields
   */
  static canUsePartnerExpenseFields(orgId: string): FeatureCheckResult {
    const allowed = isFeatureEnabled(orgId, 'partnerExpenseAccount')
    return {
      allowed,
      reason: !allowed
        ? 'Partner expense fields not available for this organization'
        : undefined,
    }
  }

  /**
   * Get all available features for organization
   */
  static getAvailableFeatures(orgId: string) {
    return getOrganizationFeatures(orgId)
  }

  /**
   * Validate feature access - throws if not allowed
   * Use in backend services for security
   */
  static validateFeatureAccess(orgId: string, feature: string): void {
    const check = this.checkFeatureAccess(orgId, feature)
    if (!check.allowed) {
      throw new Error(`Feature access denied: ${check.reason}`)
    }
  }

  /**
   * Generic feature check
   */
  private static checkFeatureAccess(
    orgId: string,
    feature: string
  ): FeatureCheckResult {
    const features = getOrganizationFeatures(orgId)
    const featureKey = feature as keyof typeof features
    const allowed = features[featureKey] ?? false

    return {
      allowed,
      reason: !allowed ? `Feature '${feature}' not available for organization` : undefined,
    }
  }
}

// Export singleton instance for use in services
export const featureService = FeatureService
