'use client'

import { Share, MessageSquare } from '@/components/icons'

/**
 * Floating action rail that sits over the canvas (top-right): Share and
 * Comment — icon-only, stacked vertically as separate buttons.
 */
export function CanvasActions({
  onShare,
  onComments,
  commentsActive,
}: {
  onShare: () => void
  onComments: () => void
  commentsActive?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <ActionButton icon={<Share className="size-4" />} label="Share" onClick={onShare} />
      <ActionButton
        icon={<MessageSquare className="size-4" />}
        label="Comment"
        onClick={onComments}
        active={commentsActive}
      />
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active ? true : undefined}
      className={`inline-flex size-9 items-center justify-center rounded-sm border border-border shadow-sm transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {icon}
    </button>
  )
}
