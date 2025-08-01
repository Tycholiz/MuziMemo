import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type DragItem = {
  id: string
  name: string
  type: 'audio' | 'folder'
  sourcePath: string
}

export type DropTarget = {
  id: string
  name: string
  path: string
}

export type DragDropState = {
  isDragging: boolean
  dragItem: DragItem | null
  dragPosition: { x: number; y: number } | null
  validDropTargets: string[]
  currentDropTarget: string | null
}

export type DragDropActions = {
  startDrag: (item: DragItem, position: { x: number; y: number }) => void
  updateDragPosition: (position: { x: number; y: number }) => void
  setValidDropTargets: (targets: string[]) => void
  setCurrentDropTarget: (targetId: string | null) => void
  endDrag: () => void
  onDrop: (targetId: string) => Promise<void>
  setDropHandler: (handler: (dragItem: DragItem, targetId: string) => Promise<void>) => void
}

export type DragDropContextType = DragDropState & DragDropActions

const DragDropContext = createContext<DragDropContextType | null>(null)

export type DragDropProviderProps = {
  children: ReactNode
}

export function DragDropProvider({ children }: DragDropProviderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragItem, setDragItem] = useState<DragItem | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const [validDropTargets, setValidDropTargets] = useState<string[]>([])
  const [currentDropTarget, setCurrentDropTarget] = useState<string | null>(null)
  const [dropHandler, setDropHandler] = useState<((dragItem: DragItem, targetId: string) => Promise<void>) | null>(null)

  const startDrag = useCallback((item: DragItem, position: { x: number; y: number }) => {
    setDragItem(item)
    setDragPosition(position)
    setIsDragging(true)
  }, [])

  const updateDragPosition = useCallback((position: { x: number; y: number }) => {
    setDragPosition(position)
  }, [])

  const endDrag = useCallback(() => {
    setIsDragging(false)
    setDragItem(null)
    setDragPosition(null)
    setValidDropTargets([])
    setCurrentDropTarget(null)
  }, [])

  const onDrop = useCallback(async (targetId: string) => {
    if (dragItem && validDropTargets.includes(targetId) && dropHandler) {
      try {
        await dropHandler(dragItem, targetId)
      } catch (error) {
        console.error('Drop operation failed:', error)
      }
    }
    endDrag()
  }, [dragItem, validDropTargets, dropHandler, endDrag])

  const setDropHandlerCallback = useCallback((handler: (dragItem: DragItem, targetId: string) => Promise<void>) => {
    setDropHandler(() => handler)
  }, [])

  const value: DragDropContextType = {
    // State
    isDragging,
    dragItem,
    dragPosition,
    validDropTargets,
    currentDropTarget,

    // Actions
    startDrag,
    updateDragPosition,
    setValidDropTargets,
    setCurrentDropTarget,
    endDrag,
    onDrop,
    setDropHandler: setDropHandlerCallback,
  }

  return (
    <DragDropContext.Provider value={value}>
      {children}
    </DragDropContext.Provider>
  )
}

export function useDragDrop(): DragDropContextType {
  const context = useContext(DragDropContext)
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider')
  }
  return context
}
