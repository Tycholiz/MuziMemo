import React from 'react'
import { render } from '@testing-library/react-native'
import { AudioProgressBar } from '../AudioProgressBar'

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  
  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {}
  
  return Reanimated
})

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react')
  const { View } = require('react-native')

  const createGesture = () => ({
    onStart: jest.fn().mockReturnThis(),
    onUpdate: jest.fn().mockReturnThis(),
    onEnd: jest.fn().mockReturnThis(),
  })

  return {
    Gesture: {
      Pan: jest.fn(() => createGesture()),
      Tap: jest.fn(() => createGesture()),
      Race: jest.fn(() => createGesture()),
    },
    GestureDetector: ({ children }: any) => React.createElement(View, {}, children),
  }
})

describe('AudioProgressBar', () => {
  const defaultProps = {
    currentTime: 30,
    duration: 120,
    onSeek: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByRole } = render(<AudioProgressBar {...defaultProps} />)
    
    expect(getByRole('adjustable')).toBeTruthy()
  })

  it('displays correct accessibility label with progress percentage', () => {
    const { getByRole } = render(<AudioProgressBar {...defaultProps} />)
    
    const progressBar = getByRole('adjustable')
    expect(progressBar.props.accessibilityLabel).toBe('Audio progress: 25%')
  })

  it('handles zero duration gracefully', () => {
    const { getByRole } = render(
      <AudioProgressBar
        currentTime={0}
        duration={0}
        onSeek={defaultProps.onSeek}
      />
    )
    
    const progressBar = getByRole('adjustable')
    expect(progressBar.props.accessibilityLabel).toBe('Audio progress: 0%')
  })

  it('handles invalid duration gracefully', () => {
    const { getByRole } = render(
      <AudioProgressBar
        currentTime={30}
        duration={NaN}
        onSeek={defaultProps.onSeek}
      />
    )
    
    const progressBar = getByRole('adjustable')
    expect(progressBar.props.accessibilityLabel).toBe('Audio progress: 0%')
  })

  it('clamps progress to 100% when currentTime exceeds duration', () => {
    const { getByRole } = render(
      <AudioProgressBar
        currentTime={150}
        duration={120}
        onSeek={defaultProps.onSeek}
      />
    )
    
    const progressBar = getByRole('adjustable')
    expect(progressBar.props.accessibilityLabel).toBe('Audio progress: 100%')
  })

  it('has correct accessibility properties', () => {
    const { getByRole } = render(<AudioProgressBar {...defaultProps} />)
    
    const progressBar = getByRole('adjustable')
    expect(progressBar.props.accessibilityRole).toBe('adjustable')
    expect(progressBar.props.accessibilityHint).toBe('Drag to seek or tap to jump to position')
    expect(progressBar.props.accessibilityValue).toEqual({
      min: 0,
      max: 120,
      now: 30,
    })
  })

  it('applies custom style', () => {
    const customStyle = { marginTop: 20 }
    const { getByRole } = render(
      <AudioProgressBar {...defaultProps} style={customStyle} />
    )

    // Verify the component renders with custom style
    expect(getByRole('adjustable')).toBeTruthy()
  })
})
