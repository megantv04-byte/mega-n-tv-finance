/**
 * MultiTenantDataLayer.js - Ensures all data operations respect tenant boundaries
 *
 * This layer wraps data operations to automatically:
 * 1. Filter queries by organization ID
 * 2. Add orgId to new records
 * 3. Prevent cross-organization data leakage
 * 4. Validate permissions for data access
 */

class MultiTenantDataLayer {
  constructor(supabase) {
    this.supabase = supabase
  }

  /**
   * Filter data by organization
   * - Super admin sees all data
   * - Regular users see only their org data
   */
  filterByOrganization(data, orgId, isSuperAdmin = false) {
    if (!Array.isArray(data)) {
      return data
    }

    if (isSuperAdmin) {
      // Super admin can see all data
      return data
    }

    if (!orgId) {
      // No org context - return empty (should not happen in production)
      return []
    }

    // Regular user - filter by orgId
    // Include items without orgId (for backward compatibility during migration)
    return data.filter(item => item.orgId === orgId || !item.orgId)
  }

  /**
   * Ensure record has organization ID
   * @param {object} record - The record to add orgId to
   * @param {string} orgId - The organization ID
   * @returns {object} - Record with orgId
   */
  ensureOrgId(record, orgId) {
    if (!record) return record
    if (!orgId) {
      console.warn('[MultiTenantDataLayer] ensureOrgId called without orgId:', record.id)
      return record
    }
    return {
      ...record,
      orgId: orgId
    }
  }

  /**
   * Ensure batch of records all have orgId
   */
  ensureOrgIdBatch(records, orgId) {
    if (!Array.isArray(records)) {
      return records
    }
    return records.map(record => this.ensureOrgId(record, orgId))
  }

  /**
   * Validate user has access to organization data
   * @param {object} session - User session from TenantContext
   * @param {string} targetOrgId - Organization to access
   * @returns {boolean} - Whether user can access the organization
   */
  hasAccessToOrg(session, targetOrgId) {
    if (!session) return false

    // Super admin can access any org
    if (session.isSuperAdmin) {
      return true
    }

    // Regular user can only access their own org
    return session.orgId === targetOrgId
  }

  /**
   * Validate user can access a record
   * @param {object} record - The record to access
   * @param {object} session - User session
   * @returns {boolean} - Whether user can access the record
   */
  hasAccessToRecord(record, session) {
    if (!session || !record) return false

    // Super admin can access any record
    if (session.isSuperAdmin) {
      return true
    }

    // Regular user can access records in their org
    // or records without orgId (during migration)
    return record.orgId === session.orgId || !record.orgId
  }

  /**
   * Safe delete - only delete if user has access
   */
  async safeDelete(table, recordId, session) {
    if (!this.supabase) return false

    try {
      const { data, error } = await this.supabase
        .from(table)
        .select('data')
        .eq('id', recordId)
        .single()

      if (error || !data) return false

      const record = data.data || data
      if (!this.hasAccessToRecord(record, session)) {
        console.warn('[MultiTenantDataLayer] Access denied to delete record:', recordId)
        return false
      }

      await this.supabase
        .from(table)
        .delete()
        .eq('id', recordId)

      return true
    } catch (error) {
      console.error('[MultiTenantDataLayer] Delete failed:', error)
      return false
    }
  }

  /**
   * Safe update - only update if user has access
   */
  async safeUpdate(table, recordId, data, session) {
    if (!this.supabase) return null

    try {
      const { data: existing, error } = await this.supabase
        .from(table)
        .select('data')
        .eq('id', recordId)
        .single()

      if (error || !existing) return null

      const record = existing.data || existing
      if (!this.hasAccessToRecord(record, session)) {
        console.warn('[MultiTenantDataLayer] Access denied to update record:', recordId)
        return null
      }

      // Ensure orgId is preserved
      const updateData = {
        ...data,
        orgId: record.orgId || session.orgId
      }

      const { data: result, error: updateError } = await this.supabase
        .from(table)
        .update({ data: updateData })
        .eq('id', recordId)
        .select()

      if (updateError) return null
      return result?.[0]?.data
    } catch (error) {
      console.error('[MultiTenantDataLayer] Update failed:', error)
      return null
    }
  }

  /**
   * Safe insert - ensure orgId is set
   */
  async safeInsert(table, data, session) {
    if (!this.supabase) return null

    try {
      if (!session?.orgId) {
        console.warn('[MultiTenantDataLayer] Cannot insert without orgId')
        return null
      }

      const recordData = {
        ...data,
        id: data.id || `${table.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orgId: data.orgId || session.orgId
      }

      const { data: result, error } = await this.supabase
        .from(table)
        .insert([{ id: recordData.id, data: recordData }])
        .select()

      if (error) {
        console.error('[MultiTenantDataLayer] Insert failed:', error)
        return null
      }

      return result?.[0]?.data
    } catch (error) {
      console.error('[MultiTenantDataLayer] Insert error:', error)
      return null
    }
  }
}

export default MultiTenantDataLayer
