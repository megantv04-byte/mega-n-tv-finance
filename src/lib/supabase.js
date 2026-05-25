import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Returns null if env vars not configured — app falls back to mock data
export const supabase = (url && key) ? createClient(url, key) : null
