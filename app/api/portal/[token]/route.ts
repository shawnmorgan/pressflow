import { NextRequest, NextResponse } from 'next/server'
import { resolveClientProject } from '@/lib/client-portal'

/**
 * GET /api/portal/[token]
 *
 * Resolves a share token to full project data for the client portal.
 * Delegates to the resolve-share edge function (no secret key needed).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  try {
    const project = await resolveClientProject(token)

    if (!project) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
