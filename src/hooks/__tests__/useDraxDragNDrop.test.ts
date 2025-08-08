import { renderHook, act } from '@testing-library/react-native'
import { useDraxDragNDrop, DragItem } from '../useDraxDragNDrop'

describe('useDraxDragNDrop', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDraxDragNDrop())

    expect(result.current.draggedItem).toBeNull()
    expect(result.current.isDragActive).toBe(false)
    expect(result.current.dropTargetId).toBeNull()
  })

  it('should start drag operation', () => {
    const { result } = renderHook(() => useDraxDragNDrop())
    
    const dragItem: DragItem = {
      id: 'test-folder-1',
      type: 'folder',
      name: 'Test Folder',
    }

    act(() => {
      result.current.startDrag(dragItem)
    })

    expect(result.current.draggedItem).toEqual(dragItem)
    expect(result.current.isDragActive).toBe(true)
    expect(result.current.dropTargetId).toBeNull()
  })

  it('should end drag operation', () => {
    const { result } = renderHook(() => useDraxDragNDrop())
    
    const dragItem: DragItem = {
      id: 'test-audio-1',
      type: 'audioFile',
      name: 'Test Audio.m4a',
    }

    act(() => {
      result.current.startDrag(dragItem)
    })

    expect(result.current.isDragActive).toBe(true)

    act(() => {
      result.current.endDrag()
    })

    expect(result.current.draggedItem).toBeNull()
    expect(result.current.isDragActive).toBe(false)
    expect(result.current.dropTargetId).toBeNull()
  })

  it('should set and clear drop target', () => {
    const { result } = renderHook(() => useDraxDragNDrop())

    act(() => {
      result.current.setDropTarget('folder-123')
    })

    expect(result.current.dropTargetId).toBe('folder-123')

    act(() => {
      result.current.clearDropTarget()
    })

    expect(result.current.dropTargetId).toBeNull()
  })

  it('should handle drax drag start event', () => {
    const { result } = renderHook(() => useDraxDragNDrop())
    
    const dragItem: DragItem = {
      id: 'test-folder-1',
      type: 'folder',
      name: 'Test Folder',
    }

    act(() => {
      result.current.handleDragStart(dragItem)
    })

    expect(result.current.draggedItem).toEqual(dragItem)
    expect(result.current.isDragActive).toBe(true)
  })

  it('should handle drax drag end event', () => {
    const { result } = renderHook(() => useDraxDragNDrop())
    
    const dragItem: DragItem = {
      id: 'test-audio-1',
      type: 'audioFile',
      name: 'Test Audio.m4a',
    }

    act(() => {
      result.current.handleDragStart(dragItem)
    })

    expect(result.current.isDragActive).toBe(true)

    act(() => {
      result.current.handleDragEnd()
    })

    expect(result.current.isDragActive).toBe(false)
  })

  it('should handle receive drag enter event', () => {
    const { result } = renderHook(() => useDraxDragNDrop())

    act(() => {
      result.current.handleReceiveDragEnter('folder-456')
    })

    expect(result.current.dropTargetId).toBe('folder-456')
  })

  it('should handle receive drag exit event', () => {
    const { result } = renderHook(() => useDraxDragNDrop())

    act(() => {
      result.current.setDropTarget('folder-789')
    })

    expect(result.current.dropTargetId).toBe('folder-789')

    act(() => {
      result.current.handleReceiveDragExit()
    })

    expect(result.current.dropTargetId).toBeNull()
  })

  it('should not change drop target if setting to same value', () => {
    const { result } = renderHook(() => useDraxDragNDrop())

    act(() => {
      result.current.setDropTarget('folder-1')
    })

    expect(result.current.dropTargetId).toBe('folder-1')

    // Setting to same value should not trigger re-render
    act(() => {
      result.current.setDropTarget('folder-1')
    })

    expect(result.current.dropTargetId).toBe('folder-1')
  })
})
