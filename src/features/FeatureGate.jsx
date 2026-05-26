/**
 * FeatureGate Component
 * Conditionally renders children based on feature availability
 *
 * Usage:
 * <FeatureGate feature="suppliers">
 *   <SuppliersContent />
 * </FeatureGate>
 */

import { useFeatures } from './useFeatures'

export function FeatureGate({
  feature,
  children,
  fallback = null,
}) {
  const features = useFeatures()

  // Map feature names to boolean properties
  const isEnabled = features.isFeatureEnabled(feature)

  if (!isEnabled) {
    return fallback
  }

  return children
}

/**
 * Disabled Field Gate
 * Shows field but disables it with tooltip if feature not available
 *
 * Usage:
 * <FeatureFieldGate feature="depositAccounts" label="Deposit Account">
 *   <input {...props} />
 * </FeatureFieldGate>
 */
export function FeatureFieldGate({
  feature,
  label,
  children,
  showDisabledState = true,
}) {
  const features = useFeatures()

  const isEnabled = features.isFeatureEnabled(feature)
  const reason = features.getDisabledReason(feature)

  if (!showDisabledState) {
    // Hide completely if feature not available
    if (!isEnabled) return null
    return children
  }

  // Show but disable if feature not available
  return (
    <div
      title={!isEnabled ? reason : undefined}
      style={{
        opacity: isEnabled ? 1 : 0.5,
        pointerEvents: isEnabled ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Feature Unavailable Message
 * Shows message when feature is not available
 */
export function FeatureUnavailable({ feature, message = 'This feature is not available for your organization.' }) {
  const features = useFeatures()
  const isEnabled = features.isFeatureEnabled(feature)

  if (isEnabled) {
    return null
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-sm">
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  )
}
