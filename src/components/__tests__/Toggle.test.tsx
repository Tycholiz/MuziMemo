import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Toggle } from '../Toggle'

describe('Toggle', () => {
  it('should render correctly with default props', () => {
    const mockOnValueChange = jest.fn()
    
    const { getByTestId } = render(
      <Toggle
        value={false}
        onValueChange={mockOnValueChange}
        testID="test-toggle"
      />
    )
    
    expect(getByTestId('test-toggle')).toBeTruthy()
  })

  it('should render with label and description', () => {
    const mockOnValueChange = jest.fn()
    
    const { getByText } = render(
      <Toggle
        value={false}
        onValueChange={mockOnValueChange}
        label="Test Label"
        description="Test Description"
      />
    )
    
    expect(getByText('Test Label')).toBeTruthy()
    expect(getByText('Test Description')).toBeTruthy()
  })

  it('should call onValueChange when pressed', () => {
    const mockOnValueChange = jest.fn()
    
    const { getByTestId } = render(
      <Toggle
        value={false}
        onValueChange={mockOnValueChange}
        testID="test-toggle"
      />
    )
    
    fireEvent.press(getByTestId('test-toggle'))
    
    expect(mockOnValueChange).toHaveBeenCalledWith(true)
  })

  it('should call onValueChange with opposite value when pressed', () => {
    const mockOnValueChange = jest.fn()
    
    const { getByTestId } = render(
      <Toggle
        value={true}
        onValueChange={mockOnValueChange}
        testID="test-toggle"
      />
    )
    
    fireEvent.press(getByTestId('test-toggle'))
    
    expect(mockOnValueChange).toHaveBeenCalledWith(false)
  })

  it('should not call onValueChange when disabled', () => {
    const mockOnValueChange = jest.fn()
    
    const { getByTestId } = render(
      <Toggle
        value={false}
        onValueChange={mockOnValueChange}
        disabled={true}
        testID="test-toggle"
      />
    )
    
    fireEvent.press(getByTestId('test-toggle'))
    
    expect(mockOnValueChange).not.toHaveBeenCalled()
  })
})
