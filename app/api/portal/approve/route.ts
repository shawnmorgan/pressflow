import { NextRequest, NextResponse } from 'next/server'
import { invokeEdgeFunction } from '@/lib/edge-functions'

/**
 * POST /api/portal/approve
 * Body: { token, targetType, targetId, status, note? }
 *
 * Forwards to the client-approve edge function.
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, targetType, targetId, status, note } = body

  if (!token || !targetType || !targetId || !status) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await invokeEdgeFunction('client-approve', {
    token,
    targetType,
    targetId,
    status,
    note,
  })

  if (error) {
    return NextResponse.json({ error }, { status: 403 })
  }

  return NextResponse.json(data)
}
