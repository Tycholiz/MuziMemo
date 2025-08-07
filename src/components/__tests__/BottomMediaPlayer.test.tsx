import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { BottomMediaPlayer } from '../BottomMediaPlayer'

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')

  // Add useSharedValue mock
  Reanimated.useSharedValue = jest.fn(initialValue => ({
    value: initialValue,
  }))

  // Add runOnUI mock
  Reanimated.runOnUI = jest.fn(fn => fn)

  return Reanimated
})

// Mock react-native-awesome-slider
jest.mock('react-native-awesome-slider', () => ({
  Slider: 'Slider',
}))

describe('BottomMediaPlayer', () => {
  const defaultProps = {
    title: 'Test Audio',
    isPlaying: false,
    isVisible: true,
    currentTimeSeconds: 0,
    durationSeconds: 120,
    onPlayPause: jest.fn(),
    onSeek: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render when visible with valid duration', () => {
    const { getByText } = render(<BottomMediaPlayer {...defaultProps} />)

    expect(getByText('Test Audio')).toBeTruthy()
  })

  it('should not render when not visible', () => {
    const { queryByText } = render(<BottomMediaPlayer {...defaultProps} isVisible={false} />)

    expect(queryByText('Test Audio')).toBeNull()
  })

  it('should render AudioProgressBar when onSeek is provided', () => {
    const { getByText } = render(<BottomMediaPlayer {...defaultProps} />)

    // AudioProgressBar should be rendered since onSeek is provided
    // Check for time labels which are part of AudioProgressBar
    expect(getByText('00:00')).toBeTruthy()
    expect(getByText('02:00')).toBeTruthy()
  })

  it('should not render AudioProgressBar when onSeek is not provided', () => {
    const { queryByText } = render(<BottomMediaPlayer {...defaultProps} onSeek={undefined} />)

    // AudioProgressBar should not be rendered when onSeek is undefined
    // Time labels should not be present
    expect(queryByText('00:00')).toBeNull()
    expect(queryByText('02:00')).toBeNull()
  })

  it('should render complete UI when all props are provided', () => {
    const { getByText } = render(<BottomMediaPlayer {...defaultProps} artist="Test Artist" duration="02:00" />)

    // Should render title
    expect(getByText('Test Audio')).toBeTruthy()

    // Should render artist info (check for artist name separately)
    expect(getByText(/Test Artist/)).toBeTruthy()

    // Should render progress bar time labels
    expect(getByText('00:00')).toBeTruthy()
    expect(getByText('02:00')).toBeTruthy()
  })

  it('should handle zero duration gracefully', () => {
    const { getByText } = render(<BottomMediaPlayer {...defaultProps} durationSeconds={0} />)

    // Should still render the media card
    expect(getByText('Test Audio')).toBeTruthy()
  })

  it('should call skip callbacks when skip buttons are pressed', () => {
    const mockOnSkipForward = jest.fn()
    const mockOnSkipBackward = jest.fn()

    const { UNSAFE_getAllByType } = render(
      <BottomMediaPlayer {...defaultProps} onSkipForward={mockOnSkipForward} onSkipBackward={mockOnSkipBackward} />
    )

    // Get all TouchableOpacity components (buttons)
    const TouchableOpacity = require('react-native').TouchableOpacity
    const buttons = UNSAFE_getAllByType(TouchableOpacity)

    // Find skip backward button (first button)
    const skipBackwardButton = buttons[0]
    fireEvent.press(skipBackwardButton)
    expect(mockOnSkipBackward).toHaveBeenCalledTimes(1)

    // Find skip forward button (third button, after play/pause)
    const skipForwardButton = buttons[2]
    fireEvent.press(skipForwardButton)
    expect(mockOnSkipForward).toHaveBeenCalledTimes(1)
  })

  it('should render FileContextMenuModal when file operation callbacks are provided', () => {
    const mockOnRename = jest.fn()
    const mockOnMove = jest.fn()
    const mockOnDelete = jest.fn()

    const { getByText, UNSAFE_getAllByType } = render(
      <BottomMediaPlayer {...defaultProps} onRename={mockOnRename} onMove={mockOnMove} onDelete={mockOnDelete} />
    )

    // Component should render with the title
    expect(getByText('Test Audio')).toBeTruthy()

    // Should have more TouchableOpacity components (including the ellipsis button)
    const TouchableOpacity = require('react-native').TouchableOpacity
    const buttons = UNSAFE_getAllByType(TouchableOpacity)
    expect(buttons.length).toBeGreaterThan(3) // Skip buttons + play/pause + ellipsis
  })

  it('should not render ellipsis menu when no file operation callbacks are provided', () => {
    const { getByText, UNSAFE_getAllByType } = render(<BottomMediaPlayer {...defaultProps} />)

    // Component should still render normally
    expect(getByText('Test Audio')).toBeTruthy()

    // Should have fewer TouchableOpacity components (no ellipsis button)
    const TouchableOpacity = require('react-native').TouchableOpacity
    const buttons = UNSAFE_getAllByType(TouchableOpacity)
    expect(buttons.length).toBe(3) // Only skip buttons + play/pause, no ellipsis
  })
})
