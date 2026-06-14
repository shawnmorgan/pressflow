'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  CreditCard,
  Shield,
  Check,
  ExternalLink,
  Download,
  Sparkles,
} from '@/components/icons'
import { ConnectionsContent } from '@/components/connections/connections-content'
import { SettingsContent } from '@/components/settings/settings-content'

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
    {children}
  </span>
)

const INVOICES = [
  { id: 'INV-2026-006', date: 'Jun 1, 2026', amount: '$39.00' },
  { id: 'INV-2026-005', date: 'May 1, 2026', amount: '$39.00' },
  { id: 'INV-2026-004', date: 'Apr 1, 2026', amount: '$39.00' },
  { id: 'INV-2026-003', date: 'Mar 1, 2026', amount: '$39.00' },
]

const LOGINS = [
  { provider: 'Google', detail: 'maya@aurorapress.io', connected: true },
  { provider: 'GitHub', detail: '@mayatang', connected: true },
  { provider: 'WordPress.com', detail: 'Not connected', connected: false },
]

export default function AccountPage() {
  const [name, setName] = useState('Maya Tang')
  const [email, setEmail] = useState('maya@aurorapress.io')
  const [twoFactor, setTwoFactor] = useState(false)

  return (
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
        <h1 className="text-[15px] font-semibold text-foreground">Account</h1>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-10 px-5 py-8">
          {/* Profile */}
          <section>
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
              <User className="size-4 text-muted-foreground" />
              Profile
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              How you appear across PressFlow.
            </p>

            <div className="mt-4 flex flex-col gap-5 rounded-sm border border-border bg-card p-5">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-sm bg-primary text-[20px] font-semibold text-primary-foreground">
                  MT
                </span>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
                  >
                    Upload avatar
                  </button>
                  <span className="text-[11px] text-muted-foreground">
                    PNG or JPG, at least 256×256px.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <FieldLabel>Full name</FieldLabel>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <FieldLabel>Email</FieldLabel>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary"
                  />
                </label>
              </div>

              <div className="flex justify-end border-t border-border pt-4">
                <button
                  type="button"
                  className="rounded-sm bg-primary px-3.5 py-2 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  Save changes
                </button>
              </div>
            </div>
          </section>

          {/* Plan & billing */}
          <section>
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
              <CreditCard className="size-4 text-muted-foreground" />
              Plan &amp; billing
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Manage your subscription and download invoices.
            </p>

            <div className="mt-4 flex flex-col gap-5 rounded-sm border border-border bg-card p-5">
              {/* Current plan */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-foreground">
                      Pro
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-sm bg-primary/[0.1] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Current
                    </span>
                  </div>
                  <div className="mt-0.5 text-[13px] text-muted-foreground">
                    $39/mo · unlimited projects
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-sm border border-border bg-card px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
                >
                  Billing portal
                  <ExternalLink className="size-3.5" />
                </button>
              </div>

              {/* BYO AI note */}
              <div className="flex items-start gap-2.5 rounded-sm border border-primary/30 bg-primary/[0.05] px-3.5 py-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-[12px] leading-relaxed text-foreground">
                  <span className="font-medium">Bring your own AI — no usage limits.</span>{' '}
                  Your plan is a flat price; inference runs on your own model
                  keys, so there are no per-project or token charges from
                  PressFlow.
                </p>
              </div>

              {/* Invoices */}
              <div className="border-t border-border pt-4">
                <FieldLabel>Invoices</FieldLabel>
                <ul className="mt-3 flex flex-col divide-y divide-border overflow-hidden rounded-sm border border-border">
                  {INVOICES.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex items-center justify-between gap-3 bg-background px-3.5 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="text-[13px] font-medium text-foreground">
                          {inv.id}
                        </span>
                        <span className="text-[12px] text-muted-foreground">
                          {inv.date}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <span className="text-[13px] tabular-nums text-foreground">
                          {inv.amount}
                        </span>
                        <button
                          type="button"
                          aria-label={`Download ${inv.id}`}
                          className="flex size-7 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                        >
                          <Download className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Security */}
          <section>
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
              <Shield className="size-4 text-muted-foreground" />
              Security
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Protect your account and review connected logins.
            </p>

            <div className="mt-4 flex flex-col gap-5 rounded-sm border border-border bg-card p-5">
              {/* Password */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground">
                    Password
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Last changed 3 months ago.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center justify-center rounded-sm border border-border bg-card px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
                >
                  Change password
                </button>
              </div>

              {/* 2FA */}
              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground">
                      Two-factor authentication
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        twoFactor
                          ? 'bg-[#00a32a]/[0.12] text-[#00a32a]'
                          : 'bg-muted text-[#646970]'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          twoFactor ? 'bg-[#00a32a]' : 'bg-[#a7aaad]'
                        }`}
                      />
                      {twoFactor ? 'On' : 'Off'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Require a one-time code from your authenticator app at sign in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactor((v) => !v)}
                  className={`inline-flex shrink-0 items-center justify-center rounded-sm px-3 py-2 text-[12px] font-medium transition-colors ${
                    twoFactor
                      ? 'border border-border bg-card text-foreground hover:border-foreground/30'
                      : 'bg-primary text-primary-foreground hover:bg-primary-hover'
                  }`}
                >
                  {twoFactor ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
              </div>

              {/* Connected logins */}
              <div className="border-t border-border pt-5">
                <FieldLabel>Connected logins</FieldLabel>
                <ul className="mt-3 flex flex-col gap-2">
                  {LOGINS.map((l) => (
                    <li
                      key={l.provider}
                      className="flex items-center justify-between gap-3 rounded-sm border border-border bg-background px-3.5 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-[11px] font-semibold text-muted-foreground">
                          {l.provider.slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-foreground">
                            {l.provider}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            {l.detail}
                          </div>
                        </div>
                      </div>
                      {l.connected ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-muted-foreground">
                          <Check className="size-3.5 text-[#00a32a]" />
                          Connected
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="shrink-0 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
                        >
                          Connect
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Divider into project-level configuration */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
              Project configuration
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Connections (moved from /connections) */}
          <ConnectionsContent />

          {/* Settings (moved from /settings) */}
          <SettingsContent />
        </div>
      </div>
    </div>
  )
}
