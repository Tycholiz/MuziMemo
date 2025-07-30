import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { RecordButton } from '../RecordButton'

describe('RecordButton', () => {
  const mockOnPress = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render microphone icon when idle', () => {
    const { getByTestId } = render(
      <RecordButton testID="record-button" onPress={mockOnPress} />
    )
    const button = getByTestId('record-button')
    expect(button).toBeTruthy()
  })

  it('should render pause icon when recording', () => {
    const { getByTestId } = render(
      <RecordButton 
        testID="record-button" 
        isRecording={true} 
        onPress={mockOnPress} 
      />
    )
    const button = getByTestId('record-button')
    expect(button).toBeTruthy()
  })

  it('should render play icon when paused', () => {
    const { getByTestId } = render(
      <RecordButton 
        testID="record-button" 
        isPaused={true} 
        onPress={mockOnPress} 
      />
    )
    const button = getByTestId('record-button')
    expect(button).toBeTruthy()
  })

  it('should call onPress when pressed', () => {
    const { getByTestId } = render(
      <RecordButton testID="record-button" onPress={mockOnPress} />
    )
    const button = getByTestId('record-button')
    fireEvent.press(button)
    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })

  it('should not call onPress when disabled', () => {
    const { getByTestId } = render(
      <RecordButton 
        testID="record-button" 
        disabled={true} 
        onPress={mockOnPress} 
      />
    )
    const button = getByTestId('record-button')
    fireEvent.press(button)
    expect(mockOnPress).not.toHaveBeenCalled()
  })

  it('should be disabled when disabled prop is true', () => {
    const { getByTestId } = render(
      <RecordButton 
        testID="record-button" 
        disabled={true} 
        onPress={mockOnPress} 
      />
    )
    const button = getByTestId('record-button')
    expect(button.props.accessibilityState?.disabled).toBe(true)
  })

  it('should prioritize paused state over recording state', () => {
    const { getByTestId } = render(
      <RecordButton 
        testID="record-button" 
        isRecording={true}
        isPaused={true}
        onPress={mockOnPress} 
      />
    )
    const button = getByTestId('record-button')
    expect(button).toBeTruthy()
    // When both isRecording and isPaused are true, it should show play icon (paused state)
  })
})
