
import { createClient } from '@supabase/supabase-js'

// Using public keys that are safe to be in the client
const supabaseUrl = 'https://kvoyuckytcuusqszcxom.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2b3l1Y2t5dGN1dXNxc3pjeG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMzE4ODksImV4cCI6MjA1ODgwNzg4OX0.B1hFFGbWgRnKgz8JbFyQVj7Y8ROqqAgcaxTEl2pZgAE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  }
})
