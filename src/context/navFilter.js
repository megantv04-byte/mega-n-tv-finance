// Singleton for passing filter context from Dashboard to destination pages.
// Write before navigate(), consume once on mount.
let _pending = null
export const setNavFilter = (f) => { _pending = f }
export const consumeNavFilter = () => { const f = _pending; _pending = null; return f }
