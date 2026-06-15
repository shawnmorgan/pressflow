'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Server, Copy, Check, ExternalLink } from '@/components/icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

type Status = 'connected' | 'disconnected'
type WpConnection = { id: string; label: string; url: string } | null

function StatusPill({ status }: { status: Status }) {
  const connected = status === 'connected'
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium ${
        connected
          ? 'border-[#00a32a]/30 bg-[#00a32a]/10 text-[#00822a]'
          : 'border-border bg-muted text-muted-foreground'
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          connected ? 'bg-[#00a32a]' : 'bg-muted-foreground/60'
        }`}
      />
      {connected ? 'Connected' : 'Disconnected'}
    </span>
  )
}

type Provider = {
  id: string
  name: string
  sub: string
  initial: string
  status: Status
  dbId?: string
}

const AI_PROVIDER_DEFS = [
  { kind: 'claude', name: 'Claude', sub: 'Anthropic API key · Sonnet & Opus', initial: 'C' },
  { kind: 'claude-code', name: 'Claude Code', sub: 'Local agent handoff', initial: 'CC' },
  { kind: 'openai', name: 'OpenAI / Codex', sub: 'OpenAI API key · GPT & Codex', initial: 'O' },
  { kind: 'custom', name: 'Custom API key', sub: 'Any OpenAI-compatible endpoint', initial: 'K' },
]

const MCP_ENDPOINT = 'https://mcp.pressflow.dev/p/aurora-press/sse'

export function ConnectionsContent() {
  const { user } = useAuth()
  const [providers, setProviders] = useState<Provider[]>([])
  const [wpConn, setWpConn] = useState<WpConnection>(null)
  const [copied, setCopied] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  // Load connections from DB
  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      if (!user) return
      // Get account_id
      const { data: membership } = await supabase
        .from('account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (cancelled || !membership) return
      setAccountId(membership.account_id)

      // Load account-level connections (AI providers)
      const { data: conns } = await supabase
        .from('connections')
        .select('id, kind, label, config')
        .eq('account_id', membership.account_id)

      if (cancelled) return

      const connMap = new Map<string, { id: string; config: any }>()
      conns?.forEach((c: any) => connMap.set(c.kind, { id: c.id, config: c.config }))

      setProviders(
        AI_PROVIDER_DEFS.map((def) => {
          const conn = connMap.get(def.kind)
          return {
            id: def.kind,
            name: def.name,
            sub: def.sub,
            initial: def.initial,
            status: conn ? 'connected' : 'disconnected',
            dbId: conn?.id,
          }
        }),
      )

      // Check for WordPress connection
      const wp = conns?.find((c: any) => c.kind === 'wordpress')
      setWpConn(wp ? { id: wp.id, label: wp.label ?? '', url: wp.config?.url ?? '' } : null)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const toggleProvider = async (kind: string) => {
    if (!accountId || toggling) return
    const provider = providers.find((p) => p.id === kind)
    if (!provider) return
    setToggling(kind)

    if (provider.status === 'connected' && provider.dbId) {
      // Disconnect — delete
      await supabase.from('connections').delete().eq('id', provider.dbId)
      setProviders((prev) =>
        prev.map((p) =>
          p.id === kind ? { ...p, status: 'disconnected', dbId: undefined } : p,
        ),
      )
    } else {
      // Connect — insert
      const { data } = await supabase
        .from('connections')
        .insert({
          account_id: accountId,
          kind,
          label: provider.name,
          config: {},
        })
        .select('id')
        .single()

      if (data) {
        setProviders((prev) =>
          prev.map((p) =>
            p.id === kind ? { ...p, status: 'connected', dbId: data.id } : p,
          ),
        )
      }
    }
    setToggling(null)
  }

  const copyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(MCP_ENDPOINT)
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  if (loading) {
    return (
      <section>
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
          <Sparkles className="size-4 text-muted-foreground" />
          AI / Compute
        </h2>
        <p className="mt-3 text-[13px] text-muted-foreground">Loading connections...</p>
      </section>
    )
  }

  return (
    <>
      {/* AI / Compute */}
      <section>
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
          <Sparkles className="size-4 text-muted-foreground" />
          AI / Compute
          <span className="font-normal text-muted-foreground">bring your own</span>
        </h2>
        <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
          PressFlow uses your AI — your tokens, your inference. Unlimited
          projects, flat price.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {providers.map((p) => {
            const connected = p.status === 'connected'
            return (
              <div
                key={p.id}
                className="flex flex-col gap-4 rounded-sm border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border bg-muted text-[12px] font-semibold text-foreground">
                    {p.initial}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-foreground">
                      {p.name}
                    </span>
                    <span className="block text-[11px] leading-snug text-muted-foreground">
                      {p.sub}
                    </span>
                  </span>
                  <StatusPill status={p.status} />
                </div>
                <button
                  type="button"
                  onClick={() => toggleProvider(p.id)}
                  disabled={toggling === p.id}
                  className={`w-full rounded-sm border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50 ${
                    connected
                      ? 'border-border bg-card text-foreground hover:border-foreground/30'
                      : 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover'
                  }`}
                >
                  {toggling === p.id ? 'Updating...' : connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* WordPress sites */}
      <section>
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
          <Server className="size-4 text-muted-foreground" />
          WordPress sites
        </h2>
        <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
          Connect a WordPress install over MCP. Auth is handed off securely —
          PressFlow never stores raw site credentials.
        </p>

        <div className="mt-4 rounded-sm border border-border bg-card">
          {wpConn ? (
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-border bg-muted text-muted-foreground">
                <Server className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold text-foreground">
                    {wpConn.label || wpConn.url || 'WordPress site'}
                  </span>
                  <StatusPill status="connected" />
                </div>
                {wpConn.url && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="truncate">{wpConn.url}</span>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {wpConn.url && (
                  <a
                    href={`${wpConn.url.replace(/\/$/, '')}/wp-admin`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
                  >
                    Open admin
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (wpConn.id) {
                      await supabase.from('connections').delete().eq('id', wpConn.id)
                    }
                    setWpConn(null)
                  }}
                  className="rounded-sm border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-border bg-muted text-muted-foreground">
                <Server className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-foreground">
                    No site connected
                  </span>
                  <StatusPill status="disconnected" />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Enter your site URL to start a secure MCP authorization
                  handoff.
                </p>
              </div>
              <WpConnectForm accountId={accountId} onConnected={(conn) => setWpConn(conn)} />
            </div>
          )}
        </div>
      </section>

      {/* PressFlow MCP */}
      <section>
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
          <Sparkles className="size-4 text-muted-foreground" />
          PressFlow MCP
        </h2>
        <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
          Anything you can do here, an agent can do via MCP.
        </p>

        <div className="mt-4 rounded-sm border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-[12px] font-semibold text-foreground">
              This project&apos;s endpoint
            </span>
            <StatusPill status="connected" />
          </div>
          <div className="mt-3 flex items-stretch gap-2">
            <code className="flex min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap rounded-sm border border-border bg-background px-3 py-2 font-mono text-[12px] text-foreground">
              {MCP_ENDPOINT}
            </code>
            <button
              type="button"
              onClick={copyEndpoint}
              aria-label="Copy MCP endpoint"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-border bg-card px-3 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
            >
              {copied ? (
                <Check className="size-3.5 text-[#00a32a]" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

function WpConnectForm({
  accountId,
  onConnected,
}: {
  accountId: string | null
  onConnected: (conn: WpConnection) => void
}) {
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const handleConnect = async () => {
    if (!accountId || !url.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('connections')
      .insert({
        account_id: accountId,
        kind: 'wordpress',
        label: url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        config: { url: url.trim() },
      })
      .select('id')
      .single()
    setSaving(false)
    if (data) {
      onConnected({ id: data.id, label: url.replace(/^https?:\/\//, '').replace(/\/$/, ''), url: url.trim() })
    }
  }

  return (
    <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://yoursite.com"
        className="w-full rounded-sm border border-input bg-background px-2.5 py-1.5 text-[12px] text-foreground outline-none focus:border-primary sm:w-56"
      />
      <button
        type="button"
        onClick={handleConnect}
        disabled={saving || !url.trim()}
        className="shrink-0 rounded-sm border border-primary bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Authorize'}
      </button>
    </div>
  )
}
