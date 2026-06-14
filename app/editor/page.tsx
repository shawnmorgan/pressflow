'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Workspace } from '@/components/workspace'

function EditorInner() {
  const params = useSearchParams()
  const projectId = params.get('project')

  if (!projectId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="text-[13px] text-muted-foreground">
          No project selected.
        </span>
      </div>
    )
  }

  return <Workspace projectId={projectId} />
}

export default function EditorPage() {
  return (
    <AuthGuard>
      <Suspense>
        <EditorInner />
      </Suspense>
    </AuthGuard>
  )
}
