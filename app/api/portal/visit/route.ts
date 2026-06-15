import { NextRequest, NextResponse } from 'next/server'
import { invokeEdgeFunction } from '@/lib/edge-functions'

/**
 * POST /api/portal/visit
 * Body: { token, name?, email? }
 *
 * Forwards to the identify-participant edge function.
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, name, email } = body

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const { data, error } = await invokeEdgeFunction('identify-participant', {
    token,
    name,
    email,
  })

  if (error) {
    return NextResponse.json({ error }, { status: 403 })
  }

  return NextResponse.json(data)
}
