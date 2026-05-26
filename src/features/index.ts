/**
 * Features Module
 * Centralized export of all feature control utilities
 */

// Configuration
export { organizationFeatures, getOrganizationFeatures, isFeatureEnabled } from './organizationFeatures'
export type { OrganizationFeatureFlags } from './organizationFeatures'

// Services
export { FeatureService, featureService } from './featureService'
export type { FeatureCheckResult } from './featureService'

// Hooks
export { useFeatures } from './useFeatures'
export type { UseFeaturesResult } from './useFeatures'

// Components
export { FeatureGate, FeatureFieldGate, FeatureUnavailable } from './FeatureGate'

// Route Guards
export {
  routeFeatureMap,
  canAccessRoute,
  validateRouteAccess,
  getAccessDeniedRedirect,
  hasRestrictedRoutes,
  getRestrictedRoutes,
} from './routeGuards'
