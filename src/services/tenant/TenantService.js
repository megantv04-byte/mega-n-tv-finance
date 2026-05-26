/**
 * TenantService: Organization/Tenant management
 *
 * Responsibilities:
 * - Organization CRUD
 * - Organization metadata
 * - Organization onboarding/offboarding
 * - Tenant settings
 */

class TenantService {
  constructor(organizationStore, supabase) {
    this.organizationStore = organizationStore || []
    this.supabase = supabase
    this.tenantCache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  /**
   * Get organization by ID
   * @param {string} orgId
   * @returns {Promise<object>}
   */
  async getOrganization(orgId) {
    // Check cache
    if (this.tenantCache.has(orgId)) {
      const cached = this.tenantCache.get(orgId)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    // Try Supabase first
    let org = null
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single()

        if (!error && data) {
          org = data.data ? data.data : data
        }
      } catch (e) {
        console.warn('[TenantService] Supabase fetch failed, using mock')
      }
    }

    // Fallback to mock data
    if (!org) {
      org = this.organizationStore.find((o) => o.id === orgId)
    }

    if (!org) {
      throw new Error(`Organization not found: ${orgId}`)
    }

    // Cache it
    this.tenantCache.set(orgId, { data: org, timestamp: Date.now() })
    return org
  }

  /**
   * Get all organizations
   * @param {object} options - { status: 'active', limit: 100 }
   * @returns {Promise<Array>}
   */
  async getAllOrganizations(options = {}) {
    let orgs = [...this.organizationStore]

    if (options.status) {
      orgs = orgs.filter((o) => o.status === options.status)
    }

    if (options.limit) {
      orgs = orgs.slice(0, options.limit)
    }

    return orgs
  }

  /**
   * Create new organization (Super Admin only)
   * @param {object} orgData - { name, shortName, description, plan }
   * @returns {Promise<object>}
   */
  async createOrganization(orgData) {
    const org = {
      id: `ORG-${Date.now()}`,
      name: orgData.name,
      shortName: orgData.shortName,
      description: orgData.description || '',
      plan: orgData.plan || 'starter',
      status: 'active',
      createdAt: new Date().toISOString(),
      color: this._generateOrgColor(),
      metadata: {
        maxUsers: this._getMaxUsersForPlan(orgData.plan),
        features: this._getFeaturesForPlan(orgData.plan),
        apiCallsUsed: 0,
        apiCallsLimit: this._getApiLimitForPlan(orgData.plan),
      },
    }

    // Persist to Supabase
    if (this.supabase) {
      try {
        await this.supabase.from('organizations').insert([
          { id: org.id, data: org },
        ])
      } catch (e) {
        console.warn('[TenantService] Could not persist to Supabase')
      }
    }

    // Add to local store
    this.organizationStore.push(org)
    return org
  }

  /**
   * Update organization settings
   * @param {string} orgId
   * @param {object} updates
   * @returns {Promise<object>}
   */
  async updateOrganization(orgId, updates) {
    let org = this.organizationStore.find((o) => o.id === orgId)
    if (!org) throw new Error(`Organization not found: ${orgId}`)

    const updated = {
      ...org,
      ...updates,
      id: org.id,
      createdAt: org.createdAt,
    }
    const idx = this.organizationStore.indexOf(org)
    this.organizationStore[idx] = updated

    // Persist
    if (this.supabase) {
      try {
        await this.supabase.from('organizations').upsert([
          { id: org.id, data: updated },
        ])
      } catch (e) {
        console.warn('[TenantService] Could not update in Supabase')
      }
    }

    // Invalidate cache
    this.tenantCache.delete(orgId)

    return updated
  }

  /**
   * Get organization members
   * @param {string} orgId
   * @returns {Promise<Array>}
   */
  async getOrganizationMembers(orgId) {
    // Users filtered by orgId in AppContext
    // This is a stub - actual implementation depends on user service
    return []
  }

  /**
   * Get tenant-specific settings
   * @param {string} orgId
   * @returns {object}
   */
  getTenantSettings(orgId) {
    const org = this.organizationStore.find((o) => o.id === orgId)
    if (!org) return null

    return {
      orgId,
      tenantId: org.id,
      isMultiCurrency: org.plan === 'pro' || org.plan === 'enterprise',
      isMultiLanguage: org.plan === 'enterprise',
      maxTeamSize: org.metadata?.maxUsers || 5,
      allowedFeatures: org.metadata?.features || [],
      dataRetention: org.plan === 'enterprise' ? '7 years' : '2 years',
    }
  }

  // ───────────────────────────── Private Helpers ─────────────────────────────

  _generateOrgColor() {
    const colors = [
      '#7c3aed',
      '#2563eb',
      '#059669',
      '#d97706',
      '#dc2626',
      '#0891b2',
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  _getMaxUsersForPlan(plan) {
    const limits = {
      starter: 3,
      pro: 10,
      enterprise: 999,
    }
    return limits[plan] || 3
  }

  _getFeaturesForPlan(plan) {
    const features = {
      starter: ['invoices', 'customers', 'basic_reports'],
      pro: [
        'invoices',
        'customers',
        'expenses',
        'payments',
        'advanced_reports',
        'multi_currency',
      ],
      enterprise: ['all'],
    }
    return features[plan] || features.starter
  }

  _getApiLimitForPlan(plan) {
    const limits = {
      starter: 10000,
      pro: 100000,
      enterprise: 1000000,
    }
    return limits[plan] || 10000
  }
}

export default TenantService
