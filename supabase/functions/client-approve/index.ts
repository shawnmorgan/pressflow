import {
  adminClient,
  validateToken,
  json,
  errorResponse,
  methodGuard,
} from "../_shared/validate-token.ts";

/**
 * POST /client-approve
 * Body: { token, targetType, targetId, status, note? }
 *
 * Record an approval or change request, authored by the share's participant.
 */
Deno.serve(async (req) => {
  const guard = methodGuard(req);
  if (guard) return guard;

  const payload = await req.json();
  const { token, targetType, targetId, status, note } = payload;

  if (!token || typeof token !== "string") {
    return errorResponse("Missing token", 400);
  }
  if (!targetType || typeof targetType !== "string") {
    return errorResponse("Missing targetType", 400);
  }
  if (!targetId || typeof targetId !== "string") {
    return errorResponse("Missing targetId", 400);
  }
  if (!status || typeof status !== "string") {
    return errorResponse("Missing status", 400);
  }

  const ALLOWED = ["approved", "rejected", "changes_requested"];
  if (!ALLOWED.includes(status)) {
    return errorResponse(`Invalid status. Allowed: ${ALLOWED.join(", ")}`, 400);
  }

  const share = await validateToken(token);
  if (!share) {
    return errorResponse("Invalid or revoked token", 403);
  }

  const supabase = adminClient();

  const { data, error } = await supabase
    .from("approvals")
    .insert({
      project_id: share.project_id,
      target_type: targetType,
      target_id: targetId,
      participant_id: share.participant_id,
      status,
      note: note ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return json({ id: data.id });
});
