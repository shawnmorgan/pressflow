import {
  adminClient,
  validateToken,
  json,
  errorResponse,
  methodGuard,
} from "../_shared/validate-token.ts";

/**
 * POST /client-submit
 * Body: { token, formSectionId, values, status? }
 *
 * Autosave a content_submissions row. Validates token + can_edit_content,
 * scopes the write to the token's project.
 */
Deno.serve(async (req) => {
  const guard = methodGuard(req);
  if (guard) return guard;

  const body = await req.json();
  const { token, formSectionId, values, status } = body;

  if (!token || typeof token !== "string") {
    return errorResponse("Missing token", 400);
  }
  if (!formSectionId || typeof formSectionId !== "string") {
    return errorResponse("Missing formSectionId", 400);
  }
  if (!values || typeof values !== "object") {
    return errorResponse("Missing values", 400);
  }

  const share = await validateToken(token);
  if (!share) {
    return errorResponse("Invalid or revoked token", 403);
  }
  if (!share.can_edit_content) {
    return errorResponse("Content editing not allowed", 403);
  }

  const supabase = adminClient();

  // Check for existing submission
  const { data: existing } = await supabase
    .from("content_submissions")
    .select("id")
    .eq("project_id", share.project_id)
    .eq("form_section_id", formSectionId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("content_submissions")
      .update({
        values,
        status: status ?? "submitted",
        last_participant_id: share.participant_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      return errorResponse(error.message, 500);
    }
    return json({ id: existing.id });
  }

  const { data, error } = await supabase
    .from("content_submissions")
    .insert({
      project_id: share.project_id,
      form_section_id: formSectionId,
      values,
      status: status ?? "submitted",
      last_participant_id: share.participant_id,
    })
    .select("id")
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return json({ id: data.id });
});
