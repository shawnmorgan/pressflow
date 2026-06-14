'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from '@/components/icons'
import { STATUS_META, type TokenStatus } from '@/lib/tokens'

export function StatusPill({
  status,
  onConfirm,
}: {
  status: TokenStatus
  onConfirm?: () => void
}) {
  const meta = STATUS_META[status]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium"
        style={{ color: meta.text }}
      >
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: meta.dot }}
        />
        {meta.label}
      </span>
      {status === 'offgrid' && onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-sm border border-[#dba617]/40 bg-[#dba617]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#b26200] transition-colors hover:bg-[#dba617]/20"
        >
          Confirm
        </button>
      )}
    </span>
  )
}

export function CollapsibleCard({
  icon,
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-sm border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="flex-1">
          <span className="block text-[13px] font-semibold text-foreground">
            {title}
          </span>
          {subtitle && (
            <span className="block text-[11px] text-muted-foreground">
              {subtitle}
            </span>
          )}
        </span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${
            open ? '' : '-rotate-90'
          }`}
        />
      </button>
      {open && (
        <div className="border-t border-border px-4 py-4">{children}</div>
      )}
    </section>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  )
}

const inputCls =
  'rounded-sm border border-input bg-background px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-primary'

export function NumberField({
  label,
  value,
  onChange,
  min,
  suffix = 'px',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  suffix?: string
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          min={min}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full tabular-nums ${inputCls}`}
        />
        {suffix && (
          <span className="text-[11px] text-muted-foreground">{suffix}</span>
        )}
      </div>
    </label>
  )
}

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { label: string; value: T }[]
  onChange: (v: T) => void
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => {
          const raw = e.target.value
          const match = options.find((o) => String(o.value) === raw)
          if (match) onChange(match.value)
        }}
        className={`w-full ${inputCls}`}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <span
          className="relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-border"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            aria-label={label}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full uppercase tabular-nums ${inputCls}`}
        />
      </div>
    </label>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      {label && <Label>{label}</Label>}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${mono ? 'font-mono ' : ''}${inputCls}`}
      />
    </label>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
}: {
  value: T
  options: { label: string; value: T }[]
  onChange: (v: T) => void
  size?: 'sm' | 'md'
}) {
  return (
    <div className="inline-flex rounded-sm border border-border bg-background p-0.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`rounded-sm font-medium transition-colors ${
              size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]'
            } ${
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Square icon button used for add / duplicate / remove row actions. */
export function IconButton({
  onClick,
  label,
  danger = false,
  disabled = false,
  children,
}: {
  onClick: () => void
  label: string
  danger?: boolean
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex size-7 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'hover:border-[#d63638]/40 hover:text-[#d63638]'
          : 'hover:border-foreground/30 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-border bg-muted'
      }`}
    >
      <span
        className={`inline-block size-3.5 rounded-full bg-background shadow-sm transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
