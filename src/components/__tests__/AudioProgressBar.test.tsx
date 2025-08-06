import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { AudioProgressBar } from '../AudioProgressBar'

// Mock the slider component
jest.mock('@react-native-community/slider', () => {
  const { View } = require('react-native')
  return function MockSlider(props: any) {
    return (
      <View
        testID="audio-progress-slider"
        onTouchStart={() => props.onSlidingStart?.()}
        onTouchMove={() => props.onValueChange?.(0.5)}
        onTouchEnd={() => props.onSlidingComplete?.(0.5)}
      />
    )
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

  it('should render correctly', () => {
    const { getByTestId } = render(<AudioProgressBar {...defaultProps} />)
    
    expect(getByTestId('audio-progress-slider')).toBeTruthy()
    expect(getByTestId('current-time-label')).toBeTruthy()
    expect(getByTestId('duration-label')).toBeTruthy()
  })

  it('should display correct time labels for short durations', () => {
    const { getByTestId } = render(<AudioProgressBar {...defaultProps} />)
    
    expect(getByTestId('current-time-label')).toHaveTextContent('00:30')
    expect(getByTestId('duration-label')).toHaveTextContent('02:00')
  })

  it('should display correct time labels for long durations', () => {
    const props = {
      currentTime: 3661, // 1 hour, 1 minute, 1 second
      duration: 7200, // 2 hours
      onSeek: jest.fn(),
    }
    
    const { getByTestId } = render(<AudioProgressBar {...props} />)
    
    expect(getByTestId('current-time-label')).toHaveTextContent('01:01:01')
    expect(getByTestId('duration-label')).toHaveTextContent('02:00:00')
  })

  it('should handle zero duration', () => {
    const props = {
      currentTime: 0,
      duration: 0,
      onSeek: jest.fn(),
    }
    
    const { getByTestId } = render(<AudioProgressBar {...props} />)
    
    expect(getByTestId('current-time-label')).toHaveTextContent('00:00')
    expect(getByTestId('duration-label')).toHaveTextContent('00:00')
  })

  it('should handle negative current time', () => {
    const props = {
      currentTime: -10,
      duration: 120,
      onSeek: jest.fn(),
    }
    
    const { getByTestId } = render(<AudioProgressBar {...props} />)
    
    expect(getByTestId('current-time-label')).toHaveTextContent('00:00')
  })

  it('should handle current time greater than duration', () => {
    const props = {
      currentTime: 150,
      duration: 120,
      onSeek: jest.fn(),
    }
    
    const { getByTestId } = render(<AudioProgressBar {...props} />)
    
    expect(getByTestId('current-time-label')).toHaveTextContent('02:00')
  })

  it('should call onSeek when scrubbing completes', () => {
    const onSeek = jest.fn()
    const props = {
      ...defaultProps,
      onSeek,
    }
    
    const { getByTestId } = render(<AudioProgressBar {...props} />)
    const slider = getByTestId('audio-progress-slider')
    
    fireEvent(slider, 'touchEnd')
    
    expect(onSeek).toHaveBeenCalledWith(60) // 0.5 * 120 = 60
  })

  it('should be disabled when disabled prop is true', () => {
    const { getByTestId } = render(<AudioProgressBar {...defaultProps} disabled />)
    const slider = getByTestId('audio-progress-slider')
    
    expect(slider.props.disabled).toBe(true)
  })

  it('should be disabled when duration is zero', () => {
    const props = {
      currentTime: 0,
      duration: 0,
      onSeek: jest.fn(),
    }
    
    const { getByTestId } = render(<AudioProgressBar {...props} />)
    const slider = getByTestId('audio-progress-slider')
    
    expect(slider.props.disabled).toBe(true)
  })
})
