'use client'

import Link from 'next/link'
import { ArrowLeft } from '@/components/icons'
import { SettingsContent } from '@/components/settings/settings-content'
import { AuthGuard } from '@/components/auth-guard'

export default function SettingsPage() {
  return (
    <AuthGuard>
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <Link
          href="/editor"
          aria-label="Back to workspace"
          className="flex size-8 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-[15px] font-semibold text-foreground">Settings</h1>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-10 px-5 py-8">
          <SettingsContent />
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}
