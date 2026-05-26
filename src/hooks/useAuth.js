import { useCallback } from 'react'
import { useApp } from '../context/AppContext'

/**
 * Hook for authentication operations
 *
 * Usage:
 *   const { currentUser, login, logout, isSuperAdmin } = useAuth()
 */
export function useAuth() {
  const { currentUser, currentOrg, authService } = useApp()

  const login = useCallback(
    async (username, password) => {
      return await authService.login(username, password)
    },
    [authService]
  )

  const logout = useCallback(async () => {
    return await authService.logout()
  }, [authService])

  const isAuthenticated = useCallback(() => {
    return authService.isAuthenticated()
  }, [authService])

  const isSuperAdmin = useCallback(() => {
    return authService.isSuperAdmin()
  }, [authService])

  const getCurrentUser = useCallback(() => {
    return authService.getCurrentUser()
  }, [authService])

  const getCurrentOrg = useCallback(() => {
    return authService.getCurrentOrg()
  }, [authService])

  return {
    currentUser,
    currentOrg,
    login,
    logout,
    isAuthenticated,
    isSuperAdmin,
    getCurrentUser,
    getCurrentOrg,
  }
}
