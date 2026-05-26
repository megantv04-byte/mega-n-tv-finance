import { useCallback } from 'react'
import { useApp } from '../context/AppContext'

/**
 * Hook for tenant-aware data operations
 *
 * Usage:
 *   const { create, update, delete: deleteRecord } = useTenantData()
 */
export function useTenantData() {
  const {
    currentUser,
    tenantDataLayer,
    invoices,
    setInvoices,
    customers,
    setCustomers,
    expenses,
    setExpenses,
    payments,
    setPayments,
    vendors,
    setVendors,
  } = useApp()

  /**
   * Create a new record
   */
  const create = useCallback(
    (type, data) => {
      if (!currentUser) throw new Error('No authenticated user')

      try {
        const record = tenantDataLayer.createRecord(type, data)

        // Add to appropriate state
        switch (type) {
          case 'invoice':
            setInvoices((prev) => [...prev, record])
            break
          case 'customer':
            setCustomers((prev) => [...prev, record])
            break
          case 'expense':
            setExpenses((prev) => [...prev, record])
            break
          case 'payment':
            setPayments((prev) => [...prev, record])
            break
          case 'vendor':
            setVendors((prev) => [...prev, record])
            break
        }

        return record
      } catch (error) {
        console.error(`[useTenantData] Failed to create ${type}:`, error)
        throw error
      }
    },
    [currentUser, tenantDataLayer, setInvoices, setCustomers, setExpenses, setPayments, setVendors]
  )

  /**
   * Update an existing record
   */
  const update = useCallback(
    (type, id, updates) => {
      if (!currentUser) throw new Error('No authenticated user')

      try {
        let currentItems
        let setter

        switch (type) {
          case 'invoice':
            currentItems = invoices
            setter = setInvoices
            break
          case 'customer':
            currentItems = customers
            setter = setCustomers
            break
          case 'expense':
            currentItems = expenses
            setter = setExpenses
            break
          case 'payment':
            currentItems = payments
            setter = setPayments
            break
          case 'vendor':
            currentItems = vendors
            setter = setVendors
            break
          default:
            throw new Error(`Unknown type: ${type}`)
        }

        const updated = tenantDataLayer.updateRecord(
          type,
          id,
          updates,
          currentItems
        )
        setter((prev) => prev.map((item) => (item.id === id ? updated : item)))
        return updated
      } catch (error) {
        console.error(`[useTenantData] Failed to update ${type}:`, error)
        throw error
      }
    },
    [
      currentUser,
      tenantDataLayer,
      invoices,
      customers,
      expenses,
      payments,
      vendors,
      setInvoices,
      setCustomers,
      setExpenses,
      setPayments,
      setVendors,
    ]
  )

  /**
   * Delete a record
   */
  const deleteRecord = useCallback(
    (type, id) => {
      if (!currentUser) throw new Error('No authenticated user')

      try {
        let currentItems
        let setter

        switch (type) {
          case 'invoice':
            currentItems = invoices
            setter = setInvoices
            break
          case 'customer':
            currentItems = customers
            setter = setCustomers
            break
          case 'expense':
            currentItems = expenses
            setter = setExpenses
            break
          case 'payment':
            currentItems = payments
            setter = setPayments
            break
          case 'vendor':
            currentItems = vendors
            setter = setVendors
            break
          default:
            throw new Error(`Unknown type: ${type}`)
        }

        tenantDataLayer.deleteRecord(type, id, currentItems)
        setter((prev) => prev.filter((item) => item.id !== id))
      } catch (error) {
        console.error(`[useTenantData] Failed to delete ${type}:`, error)
        throw error
      }
    },
    [
      currentUser,
      tenantDataLayer,
      invoices,
      customers,
      expenses,
      payments,
      vendors,
      setInvoices,
      setCustomers,
      setExpenses,
      setPayments,
      setVendors,
    ]
  )

  /**
   * Bulk create records
   */
  const bulkCreate = useCallback(
    (type, records) => {
      if (!currentUser) throw new Error('No authenticated user')

      try {
        const created = tenantDataLayer.bulkCreateRecords(type, records)

        switch (type) {
          case 'invoice':
            setInvoices((prev) => [...prev, ...created])
            break
          case 'customer':
            setCustomers((prev) => [...prev, ...created])
            break
          case 'expense':
            setExpenses((prev) => [...prev, ...created])
            break
          case 'payment':
            setPayments((prev) => [...prev, ...created])
            break
          case 'vendor':
            setVendors((prev) => [...prev, ...created])
            break
        }

        return created
      } catch (error) {
        console.error(`[useTenantData] Failed to bulk create ${type}:`, error)
        throw error
      }
    },
    [currentUser, tenantDataLayer, setInvoices, setCustomers, setExpenses, setPayments, setVendors]
  )

  /**
   * Get filtered records for current org
   */
  const getRecords = useCallback(
    (type) => {
      switch (type) {
        case 'invoice':
          return tenantDataLayer.getInvoices(invoices)
        case 'customer':
          return tenantDataLayer.getCustomers(customers)
        case 'expense':
          return tenantDataLayer.getExpenses(expenses)
        case 'payment':
          return tenantDataLayer.getPayments(payments)
        case 'vendor':
          return tenantDataLayer.getSuppliers(vendors)
        default:
          return []
      }
    },
    [tenantDataLayer, invoices, customers, expenses, payments, vendors]
  )

  /**
   * Get record count
   */
  const getRecordCount = useCallback(
    (type) => {
      return tenantDataLayer.getRecordCount(type, getRecords(type))
    },
    [tenantDataLayer, getRecords]
  )

  /**
   * Search records
   */
  const search = useCallback(
    (type, query, fields) => {
      return tenantDataLayer.searchRecords(type, getRecords(type), query, fields)
    },
    [tenantDataLayer, getRecords]
  )

  return {
    create,
    update,
    delete: deleteRecord,
    bulkCreate,
    getRecords,
    getRecordCount,
    search,
  }
}
