import { useState, useCallback, useRef } from 'react'

const MAX_STACK = 50

export function useUndoRedo<T>(initial: T) {
  const [state, setStateRaw] = useState<T>(initial)
  const undoStack = useRef<T[]>([])
  const redoStack = useRef<T[]>([])

  const setState = useCallback(
    (next: T) => {
      setStateRaw((prev) => {
        undoStack.current.push(prev)
        if (undoStack.current.length > MAX_STACK) undoStack.current.shift()
        redoStack.current = []
        return next
      })
    },
    [],
  )

  const undo = useCallback(() => {
    setStateRaw((prev) => {
      const entry = undoStack.current.pop()
      if (entry === undefined) return prev
      redoStack.current.push(prev)
      return entry
    })
  }, [])

  const redo = useCallback(() => {
    setStateRaw((prev) => {
      const entry = redoStack.current.pop()
      if (entry === undefined) return prev
      undoStack.current.push(prev)
      return entry
    })
  }, [])

  // Reset state without touching undo/redo stacks (for initial data load)
  const reset = useCallback((next: T) => {
    setStateRaw(next)
    undoStack.current = []
    redoStack.current = []
  }, [])

  const canUndo = undoStack.current.length > 0
  const canRedo = redoStack.current.length > 0

  return { state, setState, reset, undo, redo, canUndo, canRedo }
}
