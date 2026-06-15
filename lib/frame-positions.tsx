'use client'

import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react'

type Pos = { x: number; y: number }

type FramePositionsCtx = {
  get: (id: string) => Pos
  set: (id: string, pos: Pos) => void
}

const Ctx = createContext<FramePositionsCtx>({
  get: () => ({ x: 0, y: 0 }),
  set: () => {},
})

export function useFramePositions() {
  return useContext(Ctx)
}

export function FramePositionsProvider({ children }: { children: ReactNode }) {
  const store = useRef<Record<string, Pos>>({})

  const get = useCallback((id: string): Pos => {
    return store.current[id] ?? { x: 0, y: 0 }
  }, [])

  const set = useCallback((id: string, pos: Pos) => {
    store.current[id] = pos
  }, [])

  return <Ctx.Provider value={{ get, set }}>{children}</Ctx.Provider>
}
