import {
  adminClient,
  validateToken,
  corsHeaders,
  json,
  errorResponse,
} from "../_shared/validate-token.ts";

/**
 * POST /client-comment
 * Body: { token, targetType, targetId, body }
 *
 * Write a comment authored by the share's participant.
 * Validates token + can_comment permission.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const payload = await req.json();
  const { token, targetType, targetId, body } = payload;

  if (!token || typeof token !== "string") {
    return errorResponse("Missing token", 400);
  }
  if (!targetType || typeof targetType !== "string") {
    return errorResponse("Missing targetType", 400);
  }
  if (!targetId || typeof targetId !== "string") {
    return errorResponse("Missing targetId", 400);
  }
  if (!body || typeof body !== "string" || !body.trim()) {
    return errorResponse("Missing or empty body", 400);
  }

  const share = await validateToken(token);
  if (!share) {
    return errorResponse("Invalid or revoked token", 403);
  }
  if (!share.can_comment) {
    return errorResponse("Commenting not allowed", 403);
  }

  const supabase = adminClient();

  const { data, error } = await supabase
    .from("comments")
    .insert({
      project_id: share.project_id,
      target_type: targetType,
      target_id: targetId,
      participant_id: share.participant_id,
      author_user_id: null,
      body: body.trim(),
    })
    .select("id")
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return json({ id: data.id });
});
