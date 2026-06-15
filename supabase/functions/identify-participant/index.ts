import {
  adminClient,
  validateToken,
  corsHeaders,
  json,
  errorResponse,
} from "../_shared/validate-token.ts";

/**
 * POST /identify-participant
 * Body: { token, name?, email? }
 *
 * The "who are you?" step. If the share already has a linked participant,
 * updates last_seen_at and returns the id. Otherwise creates a new
 * participant, links it to the share, and returns the id.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { token, name, email } = await req.json();
  if (!token || typeof token !== "string") {
    return errorResponse("Missing token", 400);
  }

  const share = await validateToken(token);
  if (!share) {
    return errorResponse("Invalid or revoked token", 403);
  }

  const supabase = adminClient();
  const now = new Date().toISOString();

  // If share already has a participant, update last_seen and return
  if (share.participant_id) {
    await supabase
      .from("participants")
      .update({ last_seen_at: now })
      .eq("id", share.participant_id);
    return json({ participantId: share.participant_id });
  }

  // Create new participant
  const { data: participant, error } = await supabase
    .from("participants")
    .insert({
      project_id: share.project_id,
      name: name ?? "Anonymous visitor",
      email: email ?? null,
      last_seen_at: now,
    })
    .select("id")
    .single();

  if (error || !participant) {
    return errorResponse("Failed to create participant", 500);
  }

  // Link participant to share
  await supabase
    .from("shares")
    .update({ participant_id: participant.id })
    .eq("id", share.id);

  return json({ participantId: participant.id });
});
