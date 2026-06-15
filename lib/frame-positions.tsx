'use client'

import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react'

type Pos = { x: number; y: number }

type FramePositionsCtx = {
  get: (id: string) => Pos
  set: (id: string, pos: Pos) => void
}

const STORAGE_KEY = 'pressflow:frame-positions'

const Ctx = createContext<FramePositionsCtx>({
  get: () => ({ x: 0, y: 0 }),
  set: () => {},
})

export function useFramePositions() {
  return useContext(Ctx)
}

export function FramePositionsProvider({ children }: { children: ReactNode }) {
  const store = useRef<Record<string, Pos>>({})
  const dirty = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          store.current = parsed
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  // Debounced persist to localStorage
  const persist = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store.current))
      } catch {
        // storage full or unavailable
      }
    }, 500)
  }, [])

  const get = useCallback((id: string): Pos => {
    return store.current[id] ?? { x: 0, y: 0 }
  }, [])

  const set = useCallback((id: string, pos: Pos) => {
    store.current[id] = pos
    dirty.current = true
    persist()
  }, [persist])

  return <Ctx.Provider value={{ get, set }}>{children}</Ctx.Provider>
}
