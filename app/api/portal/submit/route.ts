import { NextRequest, NextResponse } from 'next/server'
import { invokeEdgeFunction } from '@/lib/edge-functions'

/**
 * POST /api/portal/submit
 * Body: { token, formSectionId, values, status? }
 *
 * Forwards to the client-submit edge function.
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, formSectionId, values, status } = body

  if (!token || !formSectionId || !values) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await invokeEdgeFunction('client-submit', {
    token,
    formSectionId,
    values,
    status,
  })

  if (error) {
    return NextResponse.json({ error }, { status: 403 })
  }

  return NextResponse.json(data)
}
