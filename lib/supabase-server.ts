import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _secret: SupabaseClient

/**
 * Server-side Supabase client using the secret key.
 * Bypasses RLS — use only in trusted server contexts (API routes).
 */
export function getSecretSupabase() {
  if (!_secret) {
    _secret = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
    )
  }
  return _secret
}
