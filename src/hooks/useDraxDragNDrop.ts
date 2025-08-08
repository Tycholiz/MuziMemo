import { useState, useCallback } from 'react'

/**
 * Represents an item that can be dragged
 */
export type DragItem = {
  id: string
  type: 'folder' | 'audioFile'
  name: string
}

/**
 * Hook return type for react-native-drax drag and drop functionality
 */
export interface UseDraxDragNDropReturn {
  // State
  draggedItem: DragItem | null
  isDragActive: boolean
  dropTargetId: string | null
  
  // Actions
  startDrag: (item: DragItem) => void
  endDrag: () => void
  setDropTarget: (folderId: string | null) => void
  clearDropTarget: () => void
  
  // Drax event handlers
  handleDragStart: (item: DragItem) => void
  handleDragEnd: () => void
  handleReceiveDragEnter: (folderId: string) => void
  handleReceiveDragExit: () => void
}

/**
 * Custom hook for managing drag and drop state with react-native-drax
 * 
 * This hook provides:
 * - Drag state management (what's being dragged, drag active state)
 * - Drop target highlighting (which folder should show red border)
 * - Drax-specific event handlers for drag lifecycle
 */
export function useDraxDragNDrop(): UseDraxDragNDropReturn {
  // Core drag state
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  
  /**
   * Start dragging an item
   */
  const startDrag = useCallback((item: DragItem) => {
    console.log('🎯 useDraxDragNDrop: Starting drag for item:', item)
    setDraggedItem(item)
    setIsDragActive(true)
    setDropTargetId(null)
  }, [])
  
  /**
   * End the drag operation
   */
  const endDrag = useCallback(() => {
    console.log('🎯 useDraxDragNDrop: Ending drag operation')
    setDraggedItem(null)
    setIsDragActive(false)
    setDropTargetId(null)
  }, [])
  
  /**
   * Set the current drop target (folder to highlight)
   */
  const setDropTarget = useCallback((folderId: string | null) => {
    if (dropTargetId !== folderId) {
      console.log('🎯 useDraxDragNDrop: Setting drop target:', folderId)
      setDropTargetId(folderId)
    }
  }, [dropTargetId])
  
  /**
   * Clear the current drop target
   */
  const clearDropTarget = useCallback(() => {
    if (dropTargetId !== null) {
      console.log('🎯 useDraxDragNDrop: Clearing drop target')
      setDropTargetId(null)
    }
  }, [dropTargetId])
  
  /**
   * Handle drag start event from Drax
   */
  const handleDragStart = useCallback((item: DragItem) => {
    startDrag(item)
  }, [startDrag])
  
  /**
   * Handle drag end event from Drax
   */
  const handleDragEnd = useCallback(() => {
    endDrag()
  }, [endDrag])
  
  /**
   * Handle when dragged item enters a drop target
   */
  const handleReceiveDragEnter = useCallback((folderId: string) => {
    setDropTarget(folderId)
  }, [setDropTarget])
  
  /**
   * Handle when dragged item exits a drop target
   */
  const handleReceiveDragExit = useCallback(() => {
    clearDropTarget()
  }, [clearDropTarget])
  
  return {
    // State
    draggedItem,
    isDragActive,
    dropTargetId,
    
    // Actions
    startDrag,
    endDrag,
    setDropTarget,
    clearDropTarget,
    
    // Drax event handlers
    handleDragStart,
    handleDragEnd,
    handleReceiveDragEnter,
    handleReceiveDragExit,
  }
}
