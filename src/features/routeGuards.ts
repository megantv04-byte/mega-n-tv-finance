/**
 * Route Guards
 * Protects routes based on feature availability
 * Use in route configuration and navigation guards
 */

import { FeatureService } from './featureService'

export interface RouteGuardConfig {
  feature: string
  requiredForOrgId: string
}

/**
 * Route feature map
 * Maps routes to required features
 */
export const routeFeatureMap: Record<string, string> = {
  '/suppliers': 'suppliers',
  '/app/suppliers': 'suppliers',
  'suppliers': 'suppliers',
}

/**
 * Check if route is accessible for organization
 */
export function canAccessRoute(route: string, orgId: string): boolean {
  const requiredFeature = routeFeatureMap[route]
  if (!requiredFeature) {
    // Route has no restrictions
    return true
  }

  return FeatureService[`canAccess${capitalize(requiredFeature)}`]?.(orgId)?.allowed ?? true
}

/**
 * Validate route access - throws if not allowed
 */
export function validateRouteAccess(route: string, orgId: string): void {
  if (!canAccessRoute(route, orgId)) {
    throw new Error(`Route '${route}' is not accessible for this organization`)
  }
}

/**
 * Get redirect path if route not accessible
 */
export function getAccessDeniedRedirect(): string {
  return '/dashboard' // Redirect to dashboard if access denied
}

/**
 * Check if any route is restricted by features
 */
export function hasRestrictedRoutes(orgId: string): boolean {
  const features = FeatureService.getAvailableFeatures(orgId)
  return Object.values(features).some((feature) => !feature)
}

/**
 * Get list of restricted routes for organization
 */
export function getRestrictedRoutes(orgId: string): string[] {
  const features = FeatureService.getAvailableFeatures(orgId)
  const restricted: string[] = []

  if (!features.suppliers) {
    restricted.push('/suppliers', '/app/suppliers')
  }

  return restricted
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
