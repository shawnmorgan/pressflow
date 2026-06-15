import { NextRequest, NextResponse } from 'next/server'
import { getSecretSupabase } from '@/lib/supabase-server'

/**
 * POST /api/portal/approve
 * Body: { token, targetType, targetId, status, note? }
 *
 * Validates the share token, then inserts/updates an approval record.
 * Used by the unauthenticated client portal.
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, targetType, targetId, status, note } = body

  if (!token || !targetType || !targetId || !status) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (typeof token !== 'string' || typeof targetType !== 'string' || typeof targetId !== 'string' || typeof status !== 'string') {
    return NextResponse.json({ error: 'Invalid field types' }, { status: 400 })
  }

  const ALLOWED_STATUSES = ['approved', 'rejected', 'changes_requested']
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabase = getSecretSupabase()

  // Validate share token
  const { data: share } = await supabase
    .from('shares')
    .select('id, project_id, participant_id')
    .eq('token', token)
    .eq('revoked', false)
    .maybeSingle()

  if (!share) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  // Upsert approval
  const { data, error } = await supabase
    .from('approvals')
    .insert({
      project_id: share.project_id,
      target_type: targetType,
      target_id: targetId,
      participant_id: share.participant_id,
      status,
      note: note ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
