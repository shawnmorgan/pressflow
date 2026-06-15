import { NextRequest, NextResponse } from 'next/server'
import { getSecretSupabase } from '@/lib/supabase-server'

/**
 * POST /api/portal/visit
 * Body: { token, name?, email? }
 *
 * On portal access, creates or finds a participant and updates last_seen_at.
 * Links the participant to the share if not already linked.
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, name, email } = body

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
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

  const now = new Date().toISOString()

  // If share already has a participant, update last_seen
  if (share.participant_id) {
    await supabase
      .from('participants')
      .update({ last_seen_at: now })
      .eq('id', share.participant_id)
    return NextResponse.json({ participantId: share.participant_id })
  }

  // Create new participant
  const { data: participant } = await supabase
    .from('participants')
    .insert({
      project_id: share.project_id,
      name: name ?? 'Anonymous visitor',
      email: email ?? null,
      last_seen_at: now,
    })
    .select('id')
    .single()

  if (!participant) {
    return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 })
  }

  // Link participant to share
  await supabase
    .from('shares')
    .update({ participant_id: participant.id })
    .eq('id', share.id)

  return NextResponse.json({ participantId: participant.id })
}
