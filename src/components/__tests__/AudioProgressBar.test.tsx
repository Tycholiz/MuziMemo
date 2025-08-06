import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { AudioProgressBar } from '../AudioProgressBar'

// Mock the slider component
jest.mock('@react-native-community/slider', () => {
  const { View } = require('react-native')
  return function MockSlider(props: any) {
    return (
      <View
        testID="slider"
        onTouchStart={() => props.onSlidingStart?.()}
        onTouchEnd={() => props.onSlidingComplete?.(props.value)}
      />
    )
  }
})

describe('AudioProgressBar', () => {
  const defaultProps = {
    currentTime: 30,
    duration: 180,
    onSeek: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with basic props', () => {
    const { getByText } = render(<AudioProgressBar {...defaultProps} />)
    
    expect(getByText('00:30')).toBeTruthy()
    expect(getByText('03:00')).toBeTruthy()
  })

  it('formats time correctly for short durations (MM:SS)', () => {
    const { getByText } = render(
      <AudioProgressBar currentTime={65} duration={300} onSeek={jest.fn()} />
    )
    
    expect(getByText('01:05')).toBeTruthy()
    expect(getByText('05:00')).toBeTruthy()
  })

  it('formats time correctly for long durations (HH:MM:SS)', () => {
    const { getByText } = render(
      <AudioProgressBar currentTime={3665} duration={7200} onSeek={jest.fn()} />
    )
    
    expect(getByText('01:01:05')).toBeTruthy()
    expect(getByText('02:00:00')).toBeTruthy()
  })

  it('handles zero duration gracefully', () => {
    const { getByText } = render(
      <AudioProgressBar currentTime={0} duration={0} onSeek={jest.fn()} />
    )
    
    expect(getByText('00:00')).toBeTruthy()
  })

  it('calls onSeek when slider interaction completes', () => {
    const mockOnSeek = jest.fn()
    const { getByTestId } = render(
      <AudioProgressBar {...defaultProps} onSeek={mockOnSeek} />
    )
    
    const slider = getByTestId('slider')
    fireEvent(slider, 'touchEnd')
    
    expect(mockOnSeek).toHaveBeenCalled()
  })

  it('handles disabled state correctly', () => {
    const { getByTestId } = render(
      <AudioProgressBar {...defaultProps} disabled={true} />
    )
    
    const slider = getByTestId('slider')
    expect(slider).toBeTruthy()
  })

  it('clamps current time to valid range', () => {
    const { getByText } = render(
      <AudioProgressBar currentTime={200} duration={180} onSeek={jest.fn()} />
    )
    
    // Should show duration time, not the invalid current time
    expect(getByText('03:00')).toBeTruthy()
  })

  it('handles negative current time', () => {
    const { getByText } = render(
      <AudioProgressBar currentTime={-10} duration={180} onSeek={jest.fn()} />
    )
    
    expect(getByText('00:00')).toBeTruthy()
    expect(getByText('03:00')).toBeTruthy()
  })
})
