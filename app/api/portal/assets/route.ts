import { NextRequest, NextResponse } from 'next/server'
import { getSecretSupabase } from '@/lib/supabase-server'

/**
 * GET /api/portal/assets?token=xxx
 * Returns assets for the project associated with the share token.
 *
 * POST /api/portal/assets
 * Uploads an asset file on behalf of a portal client.
 * Body: multipart/form-data with fields: token, file, category?, slot?
 */

async function resolveShare(token: string) {
  const sb = getSecretSupabase()
  const { data } = await sb
    .from('shares')
    .select('project_id, participant_id')
    .eq('token', token)
    .eq('revoked', false)
    .limit(1)
    .maybeSingle()
  return data as { project_id: string; participant_id: string | null } | null
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const share = await resolveShare(token)
  if (!share) return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  const projectId = share.project_id

  const sb = getSecretSupabase()
  const { data: assets } = await sb
    .from('assets')
    .select('id, kind, category, slot, label, original_path, mime, bytes, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (!assets) return NextResponse.json({ assets: [] })

  // Generate signed URLs for viewable assets
  const viewable = assets.filter((a: any) => a.kind === 'image' || a.kind === 'video' || a.category === 'branding')
  const paths = viewable.map((a: any) => a.original_path)
  const urlMap = new Map<string, string>()
  if (paths.length > 0) {
    const { data: signed } = await sb.storage
      .from('assets')
      .createSignedUrls(paths, 3600)
    signed?.forEach((s: any) => {
      if (s.signedUrl) urlMap.set(s.path!, s.signedUrl)
    })
  }

  return NextResponse.json({
    assets: assets.map((a: any) => ({
      ...a,
      signedUrl: urlMap.get(a.original_path) ?? null,
    })),
  })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const token = formData.get('token') as string | null
  const file = formData.get('file') as File | null
  const category = (formData.get('category') as string) || null
  const slot = (formData.get('slot') as string) || null

  if (!token || !file) {
    return NextResponse.json({ error: 'Missing token or file' }, { status: 400 })
  }

  const share = await resolveShare(token)
  if (!share) return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  const projectId = share.project_id

  const sb = getSecretSupabase()
  const ext = file.name.split('.').pop() ?? ''
  const storagePath = `${projectId}/${crypto.randomUUID()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await sb.storage
    .from('assets')
    .upload(storagePath, arrayBuffer, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  const kind = isImage ? 'image' : isVideo ? 'video' : 'file'
  const cat = category ?? (isImage ? 'image' : isVideo ? 'video' : 'file')

  const { data, error } = await sb.from('assets').insert({
    project_id: projectId,
    kind,
    category: cat,
    slot,
    label: file.name,
    original_path: storagePath,
    mime: file.type,
    bytes: file.size,
    uploaded_by: share.participant_id,
  }).select('id').single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return signed URL for the newly uploaded asset
  let signedUrl: string | null = null
  if (isImage || isVideo || cat === 'branding') {
    const { data: signed } = await sb.storage
      .from('assets')
      .createSignedUrl(storagePath, 3600)
    signedUrl = signed?.signedUrl ?? null
  }

  return NextResponse.json({
    id: data.id,
    signedUrl,
  })
}
