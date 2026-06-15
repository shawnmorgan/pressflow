'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Hash, Mail, Copy, Check, Bell } from '@/components/icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

type Status = 'connected' | 'disconnected'

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

const LLM_MODELS = [
  { value: 'claude-sonnet-4', label: 'Claude Sonnet 4' },
  { value: 'claude-opus-4', label: 'Claude Opus 4' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4.1', label: 'GPT-4.1' },
  { value: 'custom', label: 'Custom endpoint' },
]

const MCP_ENDPOINT = 'https://mcp.pressflow.dev/p/aurora-press/sse'

export function ConnectionsContent() {
  const { user } = useAuth()
  const [accountId, setAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // AI / Compute
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('claude-sonnet-4')
  const [aiStatus, setAiStatus] = useState<Status>('disconnected')
  const [aiDbId, setAiDbId] = useState<string | null>(null)
  const [aiSaving, setAiSaving] = useState(false)

  // Notifications
  const [slackWebhook, setSlackWebhook] = useState('')
  const [slackEnabled, setSlackEnabled] = useState(false)
  const [slackDbId, setSlackDbId] = useState<string | null>(null)
  const [emailNotifs, setEmailNotifs] = useState('')
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [emailDbId, setEmailDbId] = useState<string | null>(null)
  const [notifSaving, setNotifSaving] = useState<string | null>(null)

  // MCP
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      if (!user) return
      const { data: membership } = await supabase
        .from('account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (cancelled || !membership) return
      setAccountId(membership.account_id)

      const { data: conns } = await supabase
        .from('connections')
        .select('id, kind, label, config')
        .eq('account_id', membership.account_id)

      if (cancelled) return

      const connMap = new Map<string, { id: string; config: Record<string, unknown> }>()
      conns?.forEach((c: { id: string; kind: string; config: Record<string, unknown> }) =>
        connMap.set(c.kind, { id: c.id, config: c.config ?? {} }),
      )

      // AI connection
      const ai = connMap.get('ai')
      if (ai) {
        setAiDbId(ai.id)
        setAiStatus('connected')
        setApiKey((ai.config?.api_key as string) ?? '')
        setModel((ai.config?.model as string) ?? 'claude-sonnet-4')
      }

      // Slack
      const slack = connMap.get('slack')
      if (slack) {
        setSlackDbId(slack.id)
        setSlackEnabled(true)
        setSlackWebhook((slack.config?.webhook_url as string) ?? '')
      }

      // Email
      const email = connMap.get('email-notif')
      if (email) {
        setEmailDbId(email.id)
        setEmailEnabled(true)
        setEmailNotifs((email.config?.addresses as string) ?? '')
      }

      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const connectAi = async () => {
    if (!accountId || !apiKey.trim()) return
    setAiSaving(true)
    const config = { api_key: apiKey.trim(), model }

    if (aiDbId) {
      await supabase.from('connections').update({ config }).eq('id', aiDbId)
    } else {
      const { data } = await supabase
        .from('connections')
        .insert({ account_id: accountId, kind: 'ai', label: 'AI Provider', config })
        .select('id')
        .single()
      if (data) setAiDbId(data.id)
    }
    setAiStatus('connected')
    setAiSaving(false)
  }

  const disconnectAi = async () => {
    if (!aiDbId) return
    setAiSaving(true)
    await supabase.from('connections').delete().eq('id', aiDbId)
    setAiDbId(null)
    setAiStatus('disconnected')
    setApiKey('')
    setAiSaving(false)
  }

  const saveSlack = async () => {
    if (!accountId) return
    setNotifSaving('slack')
    const config = { webhook_url: slackWebhook.trim() }
    if (slackDbId) {
      await supabase.from('connections').update({ config }).eq('id', slackDbId)
    } else {
      const { data } = await supabase
        .from('connections')
        .insert({ account_id: accountId, kind: 'slack', label: 'Slack', config })
        .select('id')
        .single()
      if (data) setSlackDbId(data.id)
    }
    setSlackEnabled(true)
    setNotifSaving(null)
  }

  const disableSlack = async () => {
    if (!slackDbId) return
    setNotifSaving('slack')
    await supabase.from('connections').delete().eq('id', slackDbId)
    setSlackDbId(null)
    setSlackEnabled(false)
    setSlackWebhook('')
    setNotifSaving(null)
  }

  const saveEmail = async () => {
    if (!accountId) return
    setNotifSaving('email')
    const config = { addresses: emailNotifs.trim() }
    if (emailDbId) {
      await supabase.from('connections').update({ config }).eq('id', emailDbId)
    } else {
      const { data } = await supabase
        .from('connections')
        .insert({ account_id: accountId, kind: 'email-notif', label: 'Email', config })
        .select('id')
        .single()
      if (data) setEmailDbId(data.id)
    }
    setEmailEnabled(true)
    setNotifSaving(null)
  }

  const disableEmail = async () => {
    if (!emailDbId) return
    setNotifSaving('email')
    await supabase.from('connections').delete().eq('id', emailDbId)
    setEmailDbId(null)
    setEmailEnabled(false)
    setEmailNotifs('')
    setNotifSaving(null)
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
          <StatusPill status={aiStatus} />
        </h2>
        <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
          PressFlow uses your AI — your tokens, your inference. Paste your API key
          and select a model.
        </p>

        <div className="mt-4 rounded-sm border border-border bg-card p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  API key
                </span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-sm border border-input bg-background px-2.5 py-2 font-mono text-[12px] text-foreground outline-none focus:border-primary"
                />
              </label>
              <label className="flex w-full flex-col gap-1.5 sm:w-48">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Model
                </span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[12px] text-foreground outline-none focus:border-primary"
                >
                  {LLM_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2">
              {aiStatus === 'connected' ? (
                <button
                  type="button"
                  onClick={disconnectAi}
                  disabled={aiSaving}
                  className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 disabled:opacity-50"
                >
                  {aiSaving ? 'Updating...' : 'Disconnect'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={connectAi}
                  disabled={aiSaving || !apiKey.trim()}
                  className="rounded-sm bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {aiSaving ? 'Connecting...' : 'Connect'}
                </button>
              )}
              {aiStatus === 'connected' && (
                <button
                  type="button"
                  onClick={connectAi}
                  disabled={aiSaving}
                  className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 disabled:opacity-50"
                >
                  Update
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section>
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
          <Bell className="size-4 text-muted-foreground" />
          Notifications
        </h2>
        <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
          Get notified when clients submit content, upload assets, or leave comments.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          {/* Slack */}
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-muted-foreground" />
              <span className="text-[13px] font-semibold text-foreground">Slack</span>
              {slackEnabled && <StatusPill status="connected" />}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Paste an incoming webhook URL to receive project notifications in a Slack channel.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <input
                type="url"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full rounded-sm border border-input bg-background px-2.5 py-2 font-mono text-[12px] text-foreground outline-none focus:border-primary"
              />
              <div className="flex shrink-0 items-center gap-2">
                {slackEnabled ? (
                  <>
                    <button
                      type="button"
                      onClick={saveSlack}
                      disabled={notifSaving === 'slack' || !slackWebhook.trim()}
                      className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 disabled:opacity-50"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={disableSlack}
                      disabled={notifSaving === 'slack'}
                      className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 disabled:opacity-50"
                    >
                      Disable
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={saveSlack}
                    disabled={notifSaving === 'slack' || !slackWebhook.trim()}
                    className="rounded-sm bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {notifSaving === 'slack' ? 'Saving...' : 'Enable'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <span className="text-[13px] font-semibold text-foreground">Email</span>
              {emailEnabled && <StatusPill status="connected" />}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Receive email notifications when project activity occurs. Separate
              multiple addresses with commas.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <input
                type="text"
                value={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.value)}
                placeholder="you@agency.com, team@agency.com"
                className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[12px] text-foreground outline-none focus:border-primary"
              />
              <div className="flex shrink-0 items-center gap-2">
                {emailEnabled ? (
                  <>
                    <button
                      type="button"
                      onClick={saveEmail}
                      disabled={notifSaving === 'email' || !emailNotifs.trim()}
                      className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 disabled:opacity-50"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={disableEmail}
                      disabled={notifSaving === 'email'}
                      className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 disabled:opacity-50"
                    >
                      Disable
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={saveEmail}
                    disabled={notifSaving === 'email' || !emailNotifs.trim()}
                    className="rounded-sm bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {notifSaving === 'email' ? 'Saving...' : 'Enable'}
                  </button>
                )}
              </div>
            </div>
          </div>
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
