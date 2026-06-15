import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client using the modern secret key (sb_secret_...).
 * Used for unauthenticated server-side reads that bypass RLS
 * (e.g. portal token resolution). Never import from client components.
 */
export function getSecretSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    throw new Error('Missing SUPABASE_SECRET_KEY env var')
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  })
}
