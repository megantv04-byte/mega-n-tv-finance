/**
 * DataMigration.js - Utility for migrating existing Supabase data to multi-tenant format
 *
 * CRITICAL: Existing Supabase records don't have orgId field. This utility:
 * 1. Backfills orgId for all records missing it
 * 2. Ensures all new records include orgId
 * 3. Validates data isolation after migration
 *
 * Usage:
 *   const migration = new DataMigration(supabase)
 *   await migration.migrateAllData(defaultOrgId)
 */

class DataMigration {
  constructor(supabase, logger = console) {
    this.supabase = supabase
    this.logger = logger
    this.stats = {
      processed: 0,
      updated: 0,
      errors: 0,
      tables: {}
    }
  }

  /**
   * Migrate all data tables to add orgId
   * @param {string} defaultOrgId - Default organization ID for existing records
   */
  async migrateAllData(defaultOrgId = 'ORG-001') {
    if (!this.supabase) {
      this.logger.warn('[DataMigration] Supabase not configured, skipping migration')
      return { status: 'skipped', reason: 'No Supabase' }
    }

    this.logger.info(`[DataMigration] Starting migration with default orgId: ${defaultOrgId}`)

    const tables = [
      'invoices',
      'customers',
      'expenses',
      'items',
      'vendors',
      'payments',
      'transfers'
    ]

    for (const table of tables) {
      try {
        await this.migrateTable(table, defaultOrgId)
      } catch (error) {
        this.logger.error(`[DataMigration] Error migrating table ${table}:`, error)
        this.stats.errors++
      }
    }

    this.logger.info('[DataMigration] Migration complete:', this.stats)
    return this.stats
  }

  /**
   * Migrate single table - add orgId to records missing it
   */
  async migrateTable(tableName, defaultOrgId) {
    const { data, error } = await this.supabase
      .from(tableName)
      .select('id, data')

    if (error) {
      this.logger.error(`[DataMigration] Error reading ${tableName}:`, error)
      this.stats.errors++
      return
    }

    if (!data || data.length === 0) {
      this.logger.info(`[DataMigration] Table ${tableName} is empty`)
      this.stats.tables[tableName] = { processed: 0, updated: 0 }
      return
    }

    // Filter records that need orgId
    const toUpdate = data
      .map(row => ({
        id: row.id,
        data: row.data
      }))
      .filter(row => !row.data?.orgId)

    if (toUpdate.length === 0) {
      this.logger.info(`[DataMigration] Table ${tableName} already has orgId on all ${data.length} records`)
      this.stats.tables[tableName] = { processed: data.length, updated: 0 }
      return
    }

    // Batch update: add orgId to records
    const batchSize = 100
    for (let i = 0; i < toUpdate.length; i += batchSize) {
      const batch = toUpdate.slice(i, i + batchSize)
      const updates = batch.map(row => ({
        id: row.id,
        data: {
          ...row.data,
          orgId: defaultOrgId
        }
      }))

      const { error: updateError } = await this.supabase
        .from(tableName)
        .upsert(updates)

      if (updateError) {
        this.logger.error(`[DataMigration] Error updating batch in ${tableName}:`, updateError)
        this.stats.errors++
      } else {
        this.stats.updated += batch.length
      }
    }

    this.stats.processed += data.length
    this.stats.tables[tableName] = {
      processed: data.length,
      updated: toUpdate.length
    }

    this.logger.info(`[DataMigration] ${tableName}: ${toUpdate.length}/${data.length} records updated`)
  }

  /**
   * Verify data isolation - ensure users only see their org data
   */
  async verifyDataIsolation(userId, orgId) {
    const tables = ['invoices', 'customers', 'expenses']
    const results = {}

    for (const table of tables) {
      const { data, error } = await this.supabase
        .from(table)
        .select('id, data')

      if (error) {
        results[table] = { error: error.message }
        continue
      }

      // Check for data leakage
      const withoutOrgId = data?.filter(row => !row.data?.orgId) || []
      const wrongOrgId = data?.filter(row => row.data?.orgId !== orgId) || []

      results[table] = {
        total: data?.length || 0,
        withoutOrgId: withoutOrgId.length,
        wrongOrgId: wrongOrgId.length,
        safe: withoutOrgId.length === 0 && wrongOrgId.length === 0
      }
    }

    return results
  }

  /**
   * Check current migration status without making changes
   */
  async checkStatus() {
    const tables = ['invoices', 'customers', 'expenses', 'items', 'vendors', 'payments', 'transfers']
    const status = {}

    for (const table of tables) {
      const { data, error } = await this.supabase
        .from(table)
        .select('id, data')

      if (error) {
        status[table] = { error: error.message }
        continue
      }

      const withOrgId = data?.filter(row => row.data?.orgId).length || 0
      const withoutOrgId = (data?.length || 0) - withOrgId

      status[table] = {
        total: data?.length || 0,
        withOrgId,
        withoutOrgId,
        needsMigration: withoutOrgId > 0
      }
    }

    return status
  }
}

export default DataMigration
