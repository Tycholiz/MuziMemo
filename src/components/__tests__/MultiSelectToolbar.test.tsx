import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { MultiSelectToolbar } from '../MultiSelectToolbar'

describe('MultiSelectToolbar', () => {
  const mockOnCancel = jest.fn()
  const mockOnMove = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with no items selected', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={0}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
      />
    )

    expect(getByText('Cancel')).toBeTruthy()
    expect(getByText('Move')).toBeTruthy()
  })

  it('renders correctly with items selected', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={3}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
      />
    )

    expect(getByText('Cancel')).toBeTruthy()
    expect(getByText('Move (3)')).toBeTruthy()
  })

  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={1}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
      />
    )

    fireEvent.press(getByText('Cancel'))
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onMove when move button is pressed with items selected', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={2}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
      />
    )

    fireEvent.press(getByText('Move (2)'))
    expect(mockOnMove).toHaveBeenCalledTimes(1)
  })

  it('disables move button when no items are selected', () => {
    const { getByText } = render(
      <MultiSelectToolbar
        selectedCount={0}
        onCancel={mockOnCancel}
        onMove={mockOnMove}
      />
    )

    const moveButton = getByText('Move')
    fireEvent.press(moveButton)
    
    // Move should not be called when no items are selected
    expect(mockOnMove).not.toHaveBeenCalled()
  })
})
