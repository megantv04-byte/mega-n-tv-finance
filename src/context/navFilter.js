// Singleton for passing filter context from Dashboard to destination pages.
// Write before navigate(), read with getNavFilter(), clear manually with clearNavFilter().
let _pending = null
export const setNavFilter   = (f) => { _pending = f }
export const getNavFilter   = ()  => _pending
export const clearNavFilter = ()  => { _pending = null }
