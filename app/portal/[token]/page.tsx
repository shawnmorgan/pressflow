import { resolveClientProject } from '@/lib/client-portal'
import { getSecretSupabase } from '@/lib/supabase-server'
import { ClientPortal } from '@/components/portal/client-portal'

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  let project = null
  try {
    const supabase = getSecretSupabase()
    project = await resolveClientProject(supabase, token)
  } catch {
    // Secret key not configured — show error
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="w-full max-w-sm rounded-sm border border-border bg-card p-8 text-center">
          <h1 className="text-[16px] font-semibold text-foreground">
            This link isn't valid
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            The access link may have expired or been mistyped. Please use the
            most recent link your project team sent you, or reach out to them
            directly.
          </p>
        </div>
      </div>
    )
  }

  return <ClientPortal project={project} />
}
