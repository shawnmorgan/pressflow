import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type Share = {
  id: string;
  project_id: string;
  token: string;
  participant_id: string | null;
  visible_views: string[];
  can_comment: boolean;
  can_edit_content: boolean;
  revoked: boolean;
};

/** Create a Supabase admin client (service role, bypasses RLS). */
export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

/**
 * Validate a share token and return the share row.
 * Returns null if invalid or revoked.
 */
export async function validateToken(
  token: string
): Promise<Share | null> {
  const supabase = adminClient();
  const { data } = await supabase
    .from("shares")
    .select(
      "id, project_id, token, participant_id, visible_views, can_comment, can_edit_content, revoked"
    )
    .eq("token", token)
    .eq("revoked", false)
    .maybeSingle();
  return data as Share | null;
}

/** Standard CORS headers for edge functions. */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Return a JSON response. */
export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Return an error JSON response. */
export function errorResponse(message: string, status = 400) {
  return json({ error: message }, status);
}
