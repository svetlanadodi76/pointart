import { createClient } from '@supabase/supabase-js'

// Client cu service role — bypass RLS, doar pentru operații admin server-side
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
