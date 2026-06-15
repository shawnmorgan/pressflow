/**
 * Client-side helper to invoke Supabase Edge Functions.
 * Used by the portal (unauthenticated client path) and server components.
 * The edge functions validate share tokens internally — no secret key needed.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

/**
 * Call a Supabase Edge Function by name.
 * Returns the parsed JSON response body.
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const json = await res.json()

    if (!res.ok) {
      return { data: null, error: json.error ?? `HTTP ${res.status}` }
    }

    return { data: json as T, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' }
  }
}
