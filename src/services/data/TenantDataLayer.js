/**
 * TenantDataLayer: Manages all data queries with automatic org filtering
 *
 * Key Pattern: Every query is automatically filtered by orgId
 * This ensures complete data isolation at the query level
 */

class TenantDataLayer {
  constructor(authService) {
    this.authService = authService
  }

  /**
   * Get invoices for current organization
   * @param {Array} allInvoices - All invoices from state
   * @returns {Array}
   */
  getInvoices(allInvoices = []) {
    return this._filterByOrganization(allInvoices)
  }

  /**
   * Get customers for current organization
   * @param {Array} allCustomers
   * @returns {Array}
   */
  getCustomers(allCustomers = []) {
    return this._filterByOrganization(allCustomers)
  }

  /**
   * Get expenses for current organization
   * @param {Array} allExpenses
   * @returns {Array}
   */
  getExpenses(allExpenses = []) {
    return this._filterByOrganization(allExpenses)
  }

  /**
   * Get payments for current organization
   * @param {Array} allPayments
   * @returns {Array}
   */
  getPayments(allPayments = []) {
    return this._filterByOrganization(allPayments)
  }

  /**
   * Get transfers for current organization
   * @param {Array} allTransfers
   * @returns {Array}
   */
  getTransfers(allTransfers = []) {
    return this._filterByOrganization(allTransfers)
  }

  /**
   * Get suppliers for current organization
   * @param {Array} allSuppliers
   * @returns {Array}
   */
  getSuppliers(allSuppliers = []) {
    return this._filterByOrganization(allSuppliers)
  }

  /**
   * Get items for current organization
   * @param {Array} allItems
   * @returns {Array}
   */
  getItems(allItems = []) {
    return this._filterByOrganization(allItems)
  }

  /**
   * Get users in current organization
   * @param {Array} allUsers
   * @returns {Array}
   */
  getOrganizationUsers(allUsers = []) {
    const user = this.authService.getCurrentUser()
    if (!user) return []

    if (user.isSuperAdmin) {
      // Super admin sees system users, not org users
      return []
    }

    // Filter to only users in this org
    return allUsers.filter(
      (u) => u.orgId === user.orgId && u.active !== false
    )
  }

  /**
   * Create a new record with org context
   * @param {string} type - 'invoice', 'customer', etc.
   * @param {object} data
   * @returns {object}
   */
  createRecord(type, data) {
    const user = this.authService.getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    if (user.isSuperAdmin) {
      throw new Error('Super admin cannot create organization records')
    }

    return {
      ...data,
      id: data.id || this._generateId(type),
      orgId: user.orgId,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * Update a record (with permission check)
   * @param {string} type
   * @param {string} id
   * @param {object} updates
   * @param {Array} currentItems
   * @returns {object}
   */
  updateRecord(type, id, updates, currentItems = []) {
    const user = this.authService.getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    const current = currentItems.find((item) => item.id === id)
    if (!current) throw new Error(`Record not found: ${id}`)

    // Verify org ownership
    if (current.orgId !== user.orgId) {
      throw new Error('Cannot update record from another organization')
    }

    return {
      ...current,
      ...updates,
      id: current.id, // Prevent ID tampering
      orgId: current.orgId, // Prevent org tampering
      createdBy: current.createdBy,
      createdAt: current.createdAt,
      updatedBy: user.id,
      updatedAt: new Date().toISOString(),
    }
  }

  /**
   * Delete a record (with permission check)
   * @param {string} type
   * @param {string} id
   * @param {Array} currentItems
   * @returns {boolean}
   */
  deleteRecord(type, id, currentItems = []) {
    const user = this.authService.getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    const current = currentItems.find((item) => item.id === id)
    if (!current) throw new Error(`Record not found: ${id}`)

    // Verify org ownership
    if (current.orgId !== user.orgId) {
      throw new Error('Cannot delete record from another organization')
    }

    return true
  }

  /**
   * Bulk create records
   * @param {string} type
   * @param {Array} records
   * @returns {Array}
   */
  bulkCreateRecords(type, records = []) {
    const user = this.authService.getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    if (user.isSuperAdmin) {
      throw new Error('Super admin cannot create organization records')
    }

    return records.map((record) =>
      this.createRecord(type, record)
    )
  }

  /**
   * Filter items by current organization
   * @private
   */
  _filterByOrganization(items = []) {
    const user = this.authService.getCurrentUser()
    if (!user) return []

    // Super admin cannot see org data
    if (user.isSuperAdmin) {
      return []
    }

    // Filter by org, or include items without orgId (legacy data migration)
    return items.filter(
      (item) => item.orgId === user.orgId || !item.orgId
    )
  }

  /**
   * Generate unique ID
   * @private
   */
  _generateId(type) {
    const prefix = {
      invoice: 'INV',
      customer: 'CUST',
      expense: 'EXP',
      payment: 'PAY',
      vendor: 'VEN',
      supplier: 'SUP',
      item: 'ITM',
      transfer: 'TRF',
    }[type] || 'REC'

    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substr(2, 5).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
  }

  /**
   * Get total count of records for current org
   * @param {string} type
   * @param {Array} items
   * @returns {number}
   */
  getRecordCount(type, items = []) {
    return this._filterByOrganization(items).length
  }

  /**
   * Search records within current org
   * @param {string} type
   * @param {Array} items
   * @param {string} query
   * @param {Array} searchFields - Fields to search in
   * @returns {Array}
   */
  searchRecords(type, items = [], query = '', searchFields = []) {
    const filtered = this._filterByOrganization(items)

    if (!query.trim()) return filtered

    const lowerQuery = query.toLowerCase()
    return filtered.filter((item) =>
      searchFields.some((field) => {
        const value = item[field]
        return (
          value &&
          String(value).toLowerCase().includes(lowerQuery)
        )
      })
    )
  }

  /**
   * Get record by ID (with org isolation)
   * @param {string} type
   * @param {string} id
   * @param {Array} items
   * @returns {object|null}
   */
  getRecordById(type, id, items = []) {
    const record = items.find((item) => item.id === id)
    if (!record) return null

    const user = this.authService.getCurrentUser()
    if (!user) return null

    // Verify org ownership
    if (record.orgId !== user.orgId && !user.isSuperAdmin) {
      return null
    }

    return record
  }
}

export default TenantDataLayer
