import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { MultiSelectToolbar } from '../MultiSelectToolbar'

describe('MultiSelectToolbar', () => {
  const mockOnCancel = jest.fn()
  const mockOnMove = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnRestore = jest.fn()
  const mockOnPermanentlyDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with no items selected (normal mode)', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={0}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
      />
    )

    expect(getByText('Cancel')).toBeTruthy()
    expect(getByText('Move')).toBeTruthy()
    expect(getByText('Delete')).toBeTruthy()
  })

  it('renders correctly with items selected (normal mode)', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={3}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
      />
    )

    expect(getByText('Cancel')).toBeTruthy()
    expect(getByText('Move (3)')).toBeTruthy()
    expect(getByText('Delete (3)')).toBeTruthy()
  })

  it('renders correctly in Recently Deleted mode with no items selected', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={0}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
        isInRecentlyDeleted={true}
        onRestore={mockOnRestore}
        onPermanentlyDelete={mockOnPermanentlyDelete}
      />
    )

    expect(getByText('Cancel')).toBeTruthy()
    expect(getByText('Restore')).toBeTruthy()
    expect(getByText('Permanently Delete')).toBeTruthy()
  })

  it('renders correctly in Recently Deleted mode with items selected', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={2}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
        isInRecentlyDeleted={true}
        onRestore={mockOnRestore}
        onPermanentlyDelete={mockOnPermanentlyDelete}
      />
    )

    expect(getByText('Cancel')).toBeTruthy()
    expect(getByText('Restore (2)')).toBeTruthy()
    expect(getByText('Permanently Delete (2)')).toBeTruthy()
  })

  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={1}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
      />
    )

    fireEvent.press(getByText('Cancel'))
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onRestore when restore button is pressed in Recently Deleted mode', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={1}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
        isInRecentlyDeleted={true}
        onRestore={mockOnRestore}
        onPermanentlyDelete={mockOnPermanentlyDelete}
      />
    )

    fireEvent.press(getByText('Restore (1)'))
    expect(mockOnRestore).toHaveBeenCalledTimes(1)
  })

  it('calls onPermanentlyDelete when permanently delete button is pressed in Recently Deleted mode', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={1}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
        isInRecentlyDeleted={true}
        onRestore={mockOnRestore}
        onPermanentlyDelete={mockOnPermanentlyDelete}
      />
    )

    fireEvent.press(getByText('Permanently Delete (1)'))
    expect(mockOnPermanentlyDelete).toHaveBeenCalledTimes(1)
  })

  it('calls onMove when move button is pressed with items selected', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={2}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
      />
    )

    fireEvent.press(getByText('Move (2)'))
    expect(mockOnMove).toHaveBeenCalledTimes(1)
  })

  it('calls onDelete when delete button is pressed with items selected', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={2}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
      />
    )

    fireEvent.press(getByText('Delete (2)'))
    expect(mockOnDelete).toHaveBeenCalledTimes(1)
  })

  it('disables move button when no items are selected', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={0}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
      />
    )

    const moveButton = getByText('Move')
    fireEvent.press(moveButton)

    // Move should not be called when no items are selected
    expect(mockOnMove).not.toHaveBeenCalled()
  })

  it('disables delete button when no items are selected', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={0}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = getByText('Delete')
    fireEvent.press(deleteButton)

    // Delete should not be called when no items are selected
    expect(mockOnDelete).not.toHaveBeenCalled()
  })
})
