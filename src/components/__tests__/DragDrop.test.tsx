import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { View, Text } from 'react-native'

import { DragDropProvider, useDragDrop } from '../../contexts/DragDropContext'
import { DraggableWrapper } from '../DraggableWrapper'
import { DropZoneWrapper } from '../DropZoneWrapper'
import { createAudioFileDragItem, createFolderDragItem } from '../../utils/dragDropUtils'

// Mock components for testing
function TestDraggable({ dragItem }: { dragItem: any }) {
  return (
    <DraggableWrapper dragItem={dragItem}>
      <View testID="draggable-item">
        <Text>Draggable Item</Text>
      </View>
    </DraggableWrapper>
  )
}

function TestDropZone({ dropTargetId }: { dropTargetId: string }) {
  return (
    <DropZoneWrapper dropTargetId={dropTargetId}>
      <View testID="drop-zone">
        <Text>Drop Zone</Text>
      </View>
    </DropZoneWrapper>
  )
}

function TestDragDropContext() {
  const dragDrop = useDragDrop()
  
  return (
    <View testID="drag-drop-context">
      <Text testID="is-dragging">{dragDrop.isDragging ? 'true' : 'false'}</Text>
      <Text testID="drag-item-name">{dragDrop.dragItem?.name || 'none'}</Text>
    </View>
  )
}

describe('DragDrop Components', () => {
  const mockDropHandler = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders DragDropProvider with children', () => {
    const { getByTestId } = render(
      <DragDropProvider onDropItem={mockDropHandler}>
        <TestDragDropContext />
      </DragDropProvider>
    )

    expect(getByTestId('drag-drop-context')).toBeTruthy()
    expect(getByTestId('is-dragging')).toHaveTextContent('false')
    expect(getByTestId('drag-item-name')).toHaveTextContent('none')
  })

  it('renders DraggableWrapper with children', () => {
    const audioFile = { id: '1', name: 'test.m4a' }
    const dragItem = createAudioFileDragItem(audioFile, '/recordings')

    const { getByTestId } = render(
      <DragDropProvider onDropItem={mockDropHandler}>
        <TestDraggable dragItem={dragItem} />
      </DragDropProvider>
    )

    expect(getByTestId('draggable-item')).toBeTruthy()
  })

  it('renders DropZoneWrapper with children', () => {
    const { getByTestId } = render(
      <DragDropProvider onDropItem={mockDropHandler}>
        <TestDropZone dropTargetId="folder-1" />
      </DragDropProvider>
    )

    expect(getByTestId('drop-zone')).toBeTruthy()
  })

  it('creates audio file drag item correctly', () => {
    const audioFile = { id: '1', name: 'test.m4a' }
    const currentPath = '/recordings/music'
    const dragItem = createAudioFileDragItem(audioFile, currentPath)

    expect(dragItem).toEqual({
      id: '1',
      name: 'test.m4a',
      type: 'audio',
      sourcePath: '/recordings/music',
    })
  })

  it('creates folder drag item correctly', () => {
    const folder = { id: '1', name: 'Music', itemCount: 5 }
    const currentPath = '/recordings'
    const dragItem = createFolderDragItem(folder, currentPath)

    expect(dragItem).toEqual({
      id: '1',
      name: 'Music',
      type: 'folder',
      sourcePath: '/recordings',
    })
  })
})
