import { createClient } from '@supabase/supabase-js'

// Supabase credentials (hardcoded — public anon key is safe)
const url = 'https://zssasbllfjeaailfteep.supabase.co'
const key = 'sb_publishable_RmkUSCdjd71U6_gYlkb7Nw_Of8u4QLx'

// Initialize Supabase client
// Supabase handles sessions automatically with auth.signInWithPassword()
export const supabase = createClient(url, key)
