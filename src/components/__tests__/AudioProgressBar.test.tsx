import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { AudioProgressBar } from '../AudioProgressBar'

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  
  // Add useSharedValue mock
  Reanimated.useSharedValue = jest.fn((initialValue) => ({
    value: initialValue,
  }))
  
  return Reanimated
})

// Mock react-native-awesome-slider
jest.mock('react-native-awesome-slider', () => ({
  Slider: ({ onValueChange, onSlidingStart, onSlidingComplete, disable, ...props }: any) => {
    const MockSlider = require('react-native').View
    return (
      <MockSlider
        testID="audio-slider"
        onTouchStart={() => onSlidingStart && onSlidingStart()}
        onTouchEnd={() => onSlidingComplete && onSlidingComplete(50)}
        disable={disable}
        {...props}
      />
    )
  },
}))

describe('AudioProgressBar', () => {
  const defaultProps = {
    currentTime: 30,
    duration: 120,
    onSeek: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render correctly with default props', () => {
    const { getByText } = render(<AudioProgressBar {...defaultProps} />)
    
    expect(getByText('00:30')).toBeTruthy() // Current time
    expect(getByText('02:00')).toBeTruthy() // Duration
  })

  it('should display formatted time labels correctly', () => {
    const { getByText } = render(
      <AudioProgressBar
        currentTime={3661} // 1 hour, 1 minute, 1 second
        duration={7200} // 2 hours
        onSeek={jest.fn()}
      />
    )
    
    expect(getByText('1:01:01')).toBeTruthy() // Current time in HH:MM:SS
    expect(getByText('2:00:00')).toBeTruthy() // Duration in HH:MM:SS
  })

  it('should handle zero duration gracefully', () => {
    const { getAllByText } = render(
      <AudioProgressBar
        currentTime={0}
        duration={0}
        onSeek={jest.fn()}
      />
    )

    const timeLabels = getAllByText('00:00')
    expect(timeLabels).toHaveLength(2) // Both current and duration should show 00:00
  })

  it('should handle undefined/invalid values', () => {
    const { getByText } = render(
      <AudioProgressBar
        currentTime={NaN}
        duration={undefined as any}
        onSeek={jest.fn()}
      />
    )
    
    expect(getByText('--:--')).toBeTruthy() // Should show fallback format
  })

  it('should call onSeek when slider interaction completes', () => {
    const mockOnSeek = jest.fn()
    const { getByTestId } = render(
      <AudioProgressBar
        {...defaultProps}
        onSeek={mockOnSeek}
      />
    )
    
    const slider = getByTestId('audio-slider')
    fireEvent(slider, 'touchEnd')
    
    expect(mockOnSeek).toHaveBeenCalledWith(50)
  })

  it('should be disabled when disabled prop is true', () => {
    const { getByTestId } = render(
      <AudioProgressBar
        {...defaultProps}
        disabled={true}
      />
    )
    
    const slider = getByTestId('audio-slider')
    expect(slider.props.disable).toBe(true)
  })

  it('should be disabled when duration is zero or invalid', () => {
    const { getByTestId } = render(
      <AudioProgressBar
        currentTime={0}
        duration={0}
        onSeek={jest.fn()}
      />
    )
    
    const slider = getByTestId('audio-slider')
    expect(slider.props.disable).toBe(true)
  })

  it('should apply custom styles', () => {
    const customStyle = { backgroundColor: 'red' }
    const { getByTestId } = render(
      <AudioProgressBar
        {...defaultProps}
        style={customStyle}
      />
    )

    // Check that the component renders with custom style
    const slider = getByTestId('audio-slider')
    expect(slider).toBeTruthy()
  })

  it('should show correct time format for short durations', () => {
    const { getByText } = render(
      <AudioProgressBar
        currentTime={45}
        duration={180} // 3 minutes
        onSeek={jest.fn()}
      />
    )
    
    expect(getByText('00:45')).toBeTruthy() // Current time in MM:SS
    expect(getByText('03:00')).toBeTruthy() // Duration in MM:SS
  })

  it('should handle edge case of exactly 1 hour', () => {
    const { getAllByText } = render(
      <AudioProgressBar
        currentTime={3600} // Exactly 1 hour
        duration={3600}
        onSeek={jest.fn()}
      />
    )

    const timeLabels = getAllByText('1:00:00')
    expect(timeLabels).toHaveLength(2) // Both current and duration should use HH:MM:SS format
  })
})
