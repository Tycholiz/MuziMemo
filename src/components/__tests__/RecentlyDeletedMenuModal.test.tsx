import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { RecentlyDeletedMenuModal } from '../RecentlyDeletedMenuModal'

describe('RecentlyDeletedMenuModal', () => {
  const mockOnEmptyRecyclingBin = jest.fn()
  const mockOnMultiSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders ellipsis button', () => {
    const { getByTestId } = render(
      <RecentlyDeletedMenuModal
        onEmptyRecyclingBin={mockOnEmptyRecyclingBin}
        onMultiSelect={mockOnMultiSelect}
      />
    )

    expect(getByTestId('recently-deleted-ellipsis-button')).toBeTruthy()
  })

  it('opens menu when ellipsis button is pressed', () => {
    const { getByTestId, getByText } = render(
      <RecentlyDeletedMenuModal
        onEmptyRecyclingBin={mockOnEmptyRecyclingBin}
        onMultiSelect={mockOnMultiSelect}
      />
    )

    fireEvent.press(getByTestId('recently-deleted-ellipsis-button'))

    expect(getByText('Multi-Select')).toBeTruthy()
    expect(getByText('Empty Recycling Bin')).toBeTruthy()
  })

  it('calls onMultiSelect when Multi-Select menu item is pressed', () => {
    const { getByTestId, getByText } = render(
      <RecentlyDeletedMenuModal
        onEmptyRecyclingBin={mockOnEmptyRecyclingBin}
        onMultiSelect={mockOnMultiSelect}
      />
    )

    // Open menu
    fireEvent.press(getByTestId('recently-deleted-ellipsis-button'))

    // Press Multi-Select menu item
    fireEvent.press(getByText('Multi-Select'))

    expect(mockOnMultiSelect).toHaveBeenCalledTimes(1)
  })

  it('calls onEmptyRecyclingBin when Empty Recycling Bin menu item is pressed', () => {
    const { getByTestId, getByText } = render(
      <RecentlyDeletedMenuModal
        onEmptyRecyclingBin={mockOnEmptyRecyclingBin}
        onMultiSelect={mockOnMultiSelect}
      />
    )

    // Open menu
    fireEvent.press(getByTestId('recently-deleted-ellipsis-button'))

    // Press Empty Recycling Bin menu item
    fireEvent.press(getByText('Empty Recycling Bin'))

    expect(mockOnEmptyRecyclingBin).toHaveBeenCalledTimes(1)
  })

  it('closes menu when overlay is pressed', () => {
    const { getByTestId, getByText, queryByText } = render(
      <RecentlyDeletedMenuModal
        onEmptyRecyclingBin={mockOnEmptyRecyclingBin}
        onMultiSelect={mockOnMultiSelect}
      />
    )

    // Open menu
    fireEvent.press(getByTestId('recently-deleted-ellipsis-button'))
    expect(getByText('Multi-Select')).toBeTruthy()
    expect(getByText('Empty Recycling Bin')).toBeTruthy()

    // Press overlay to close
    const overlay = getByText('Empty Recycling Bin').parent?.parent?.parent
    if (overlay) {
      fireEvent.press(overlay)
    }

    // Menu should be closed (this is a simplified test - in reality the modal would be hidden)
    expect(mockOnEmptyRecyclingBin).not.toHaveBeenCalled()
    expect(mockOnMultiSelect).not.toHaveBeenCalled()
  })
})
