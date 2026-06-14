'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { User, Sun, Moon, Library, Plug, LogOut } from '@/components/icons'
import { useAuth } from '@/lib/auth-context'

export function AccountMenu() {
  const { signOut } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const isDark = resolvedTheme === 'dark'

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        className="flex size-8 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <User className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-sm border border-border bg-popover py-1 shadow-lg">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            {mounted && isDark ? (
              <Sun className="size-4 text-muted-foreground" />
            ) : (
              <Moon className="size-4 text-muted-foreground" />
            )}
            {mounted && isDark ? 'Light mode' : 'Dark mode'}
          </button>

          <div className="my-1 border-t border-border" />

          {/* Library */}
          <Link
            href="/library"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Library className="size-4 text-muted-foreground" />
            Library
          </Link>

          {/* Integrations */}
          <Link
            href="/connections"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Plug className="size-4 text-muted-foreground" />
            Integrations
          </Link>

          {/* Account */}
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <User className="size-4 text-muted-foreground" />
            Account
          </Link>

          <div className="my-1 border-t border-border" />

          {/* Sign out */}
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              signOut()
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <LogOut className="size-4 text-muted-foreground" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
