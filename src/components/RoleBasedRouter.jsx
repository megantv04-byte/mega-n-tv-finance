import { useTenant } from '../context/TenantContext'
import { useApp } from '../context/AppContext'
import OrgManager from '../pages/OrgManager'
import Sidebar from './Sidebar'
import { LoadingSkeleton } from './UI'

/**
 * RoleBasedRouter - Routes to appropriate interface based on user role
 * - Super Admin in Manager Mode: System management (OrgManager) with sidebar
 * - Super Admin in Organization Mode: Regular organization app (AppLayout)
 * - Regular User: Organization app (AppLayout)
 *
 * NOTE: Modal system must be available for both views!
 */
export default function RoleBasedRouter({ AppLayout }) {
  const { session, loading: tenantLoading } = useTenant()
  const { loading: appLoading, modal, managerMode, isSuperAdmin, darkMode } = useApp()

  if (tenantLoading || appLoading) {
    return <LoadingSkeleton />
  }

  // Super admin in manager mode - with sidebar and modal support for system management
  if (isSuperAdmin && managerMode) {
    return (
      <div className={`app flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <main className={`flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <OrgManager />
          </main>
        </div>

        {/* Modal system for OrgManager */}
        {modal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget}>
            {modal}
          </div>
        )}
      </div>
    )
  }

  // Regular user or super admin in organization mode
  return <AppLayout />
}
