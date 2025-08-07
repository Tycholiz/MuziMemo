import React from 'react'
import { render } from '@testing-library/react-native'
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
})
