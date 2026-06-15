import {
  adminClient,
  validateToken,
  corsHeaders,
  json,
  errorResponse,
} from "../_shared/validate-token.ts";

/**
 * POST /resolve-share
 * Body: { token }
 *
 * Security-definer edge function: validates the share token, then returns
 * the full client project lens (project, pages, design system, agency brand).
 * This is the ONLY door for unauthenticated client reads.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return errorResponse("Missing token", 400);
  }

  const share = await validateToken(token);
  if (!share) {
    return errorResponse("Invalid or revoked token", 403);
  }

  const supabase = adminClient();

  // Load project + account white_label
  const { data: project } = await supabase
    .from("projects")
    .select(
      "name, client_name, client_domain, stage, calendar_link, relevant_links, account_id, accounts(name, white_label)"
    )
    .eq("id", share.project_id)
    .single();

  if (!project) {
    return errorResponse("Project not found", 404);
  }

  // Load pages
  const { data: pagesData } = await supabase
    .from("pages")
    .select("id, name, slug, parent_id, position, sections")
    .eq("project_id", share.project_id)
    .order("position");

  // Load design system
  const { data: dsData } = await supabase
    .from("design_systems")
    .select("tokens")
    .eq("project_id", share.project_id)
    .single();

  // Load content forms (for client content collection)
  const { data: formsData } = await supabase
    .from("content_forms")
    .select("id, kind, name, sections, sent, sent_at")
    .eq("project_id", share.project_id);

  // Load mockups
  const { data: mockupsData } = await supabase
    .from("mockups")
    .select("id, name, kind, page_id, html, created_at")
    .eq("project_id", share.project_id);

  // Build agency brand from account white_label
  const account = (project as any).accounts;
  const wl = account?.white_label ?? {};
  const agency = {
    name: wl.name ?? account?.name ?? "Your Agency",
    initials:
      wl.initials ??
      (account?.name
        ?.split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()) ??
      "YA",
    accent: wl.accent ?? "#3858e9",
    contactEmail: wl.contactEmail ?? "",
  };

  const pages = pagesData
    ? pagesData.map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        parentId: r.parent_id,
        sections: r.sections ?? [],
      }))
    : [];

  return json({
    token: share.token,
    share: {
      visibleViews: share.visible_views,
      canComment: share.can_comment,
      canEditContent: share.can_edit_content,
      participantId: share.participant_id,
    },
    agency,
    projectName: project.name,
    clientName: (project as any).client_name ?? "",
    domain: (project as any).client_domain ?? "",
    stage: (project as any).stage ?? "onboarding",
    calendarLink: (project as any).calendar_link ?? "",
    links: (project as any).relevant_links ?? [],
    pages,
    ds: dsData?.tokens ?? null,
    forms: formsData ?? [],
    mockups: mockupsData ?? [],
  });
});
