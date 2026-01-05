// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_PUBLISHABLE_KEY = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string

// Validate environment variables to avoid hard-to-debug 404/400 errors in Auth
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    'Supabase Initialization Error: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required.',
  )
}

// Ensure the Supabase URL is a valid URL to prevent network errors
try {
  if (SUPABASE_URL) {
    new URL(SUPABASE_URL)
  }
} catch (e) {
  console.error('Supabase Initialization Error: Invalid VITE_SUPABASE_URL.', e)
}

// Import the supabase client like this:
// import { supabase } from "@/lib/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
