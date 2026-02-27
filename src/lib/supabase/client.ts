import { createBrowserClient } from '@supabase/ssr'

// NOTE: Replace with auto-generated types via `supabase gen types typescript`
// once the schema is stable (see supabase/migrations/ for current migrations).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}