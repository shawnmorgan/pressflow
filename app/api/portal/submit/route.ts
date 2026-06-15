import { NextRequest, NextResponse } from 'next/server'
import { getSecretSupabase } from '@/lib/supabase-server'

/**
 * POST /api/portal/submit
 * Body: { token, formSectionId, values, status? }
 *
 * Validates the share token, then upserts a content submission.
 * Used by the unauthenticated client portal for content collection.
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, formSectionId, values, status } = body

  if (!token || !formSectionId || !values) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (typeof token !== 'string' || typeof formSectionId !== 'string' || typeof values !== 'object' || values === null) {
    return NextResponse.json({ error: 'Invalid field types' }, { status: 400 })
  }

  const supabase = getSecretSupabase()

  // Validate share token
  const { data: share } = await supabase
    .from('shares')
    .select('id, project_id, participant_id, can_edit_content')
    .eq('token', token)
    .eq('revoked', false)
    .maybeSingle()

  if (!share) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  if (!share.can_edit_content) {
    return NextResponse.json({ error: 'Content editing not allowed' }, { status: 403 })
  }

  // Check for existing submission for this section
  const { data: existing } = await supabase
    .from('content_submissions')
    .select('id')
    .eq('project_id', share.project_id)
    .eq('form_section_id', formSectionId)
    .maybeSingle()

  if (existing) {
    // Update
    const { error } = await supabase
      .from('content_submissions')
      .update({
        values,
        status: status ?? 'submitted',
        last_participant_id: share.participant_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ id: existing.id })
  }

  // Insert
  const { data, error } = await supabase
    .from('content_submissions')
    .insert({
      project_id: share.project_id,
      form_section_id: formSectionId,
      values,
      status: status ?? 'submitted',
      last_participant_id: share.participant_id,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
