/**
 * Feature-Based Route Guard Middleware
 * Protects routes based on organization feature availability
 */

import { FeatureService } from '../features/featureService'
import { routeFeatureMap, getAccessDeniedRedirect } from '../features/routeGuards'

export interface GuardContext {
  route: string
  orgId: string
}

export interface GuardResult {
  allowed: boolean
  redirectTo?: string
  reason?: string
}

/**
 * Check if route should be guarded for organization
 */
export function guardRoute(context: GuardContext): GuardResult {
  const { route, orgId } = context

  if (!orgId) {
    return {
      allowed: false,
      redirectTo: '/dashboard',
      reason: 'No organization selected',
    }
  }

  const requiredFeature = routeFeatureMap[route]

  // No restriction for this route
  if (!requiredFeature) {
    return { allowed: true }
  }

  // Check if feature is available
  const featureMethodName = `canAccess${capitalize(requiredFeature)}`
  const checkMethod = FeatureService[featureMethodName as keyof typeof FeatureService] as (
    orgId: string
  ) => any

  if (!checkMethod) {
    // Feature check method not found, allow by default
    return { allowed: true }
  }

  const result = checkMethod(orgId)

  if (!result.allowed) {
    return {
      allowed: false,
      redirectTo: getAccessDeniedRedirect(),
      reason: result.reason,
    }
  }

  return { allowed: true }
}

/**
 * Log access denial for auditing
 */
export function logAccessDenial(context: GuardContext, reason: string): void {
  console.warn(
    `[FeatureGuard] Access denied: Route "${context.route}" for organization "${context.orgId}"`,
    reason
  )

  // Could be extended to send to analytics/logging service
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
