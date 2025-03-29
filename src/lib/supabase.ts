
import { createClient } from '@supabase/supabase-js'

// Using public keys that are safe to be in the client
const supabaseUrl = 'https://your-project-url.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
