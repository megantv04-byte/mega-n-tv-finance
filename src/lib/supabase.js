import { createClient } from '@supabase/supabase-js'

// Supabase credentials (hardcoded — public anon key is safe)
const url = 'https://zssasbllfjeaailfteep.supabase.co'
const key = 'sb_publishable_RmkUSCdjd71U6_gYlkb7Nw_Of8u4QLx'

// Always connect to Supabase
export const supabase = createClient(url, key)
