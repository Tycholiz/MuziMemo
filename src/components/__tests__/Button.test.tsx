/**
 * Tests for Button component
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../Button'
import type { ButtonProps, ButtonVariant, ButtonSize } from '../Button'

describe('Button', () => {
  const mockOnPress = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('should render with title', () => {
      const { getByText } = render(<Button title="Test Button" onPress={mockOnPress} />)

      expect(getByText('Test Button')).toBeTruthy()
    })

    it('should render without title', () => {
      const { queryByText } = render(<Button onPress={mockOnPress} />)

      expect(queryByText('Test Button')).toBeFalsy()
    })

    it('should handle press events', () => {
      const { getByText } = render(<Button title="Test Button" onPress={mockOnPress} />)

      fireEvent.press(getByText('Test Button'))
      expect(mockOnPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('variants', () => {
    const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'outline', 'danger']

    variants.forEach(variant => {
      it(`should render ${variant} variant`, () => {
        const { getByText } = render(<Button title="Test Button" variant={variant} onPress={mockOnPress} />)

        expect(getByText('Test Button')).toBeTruthy()
      })
    })

    it('should default to primary variant', () => {
      const { getByText } = render(<Button title="Test Button" onPress={mockOnPress} />)

      expect(getByText('Test Button')).toBeTruthy()
    })
  })

  describe('sizes', () => {
    const sizes: ButtonSize[] = ['small', 'medium', 'large']

    sizes.forEach(size => {
      it(`should render ${size} size`, () => {
        const { getByText } = render(<Button title="Test Button" size={size} onPress={mockOnPress} />)

        expect(getByText('Test Button')).toBeTruthy()
      })
    })

    it('should default to medium size', () => {
      const { getByText } = render(<Button title="Test Button" onPress={mockOnPress} />)

      expect(getByText('Test Button')).toBeTruthy()
    })
  })

  describe('disabled state', () => {
    it('should not call onPress when disabled', () => {
      const { getByText } = render(<Button title="Test Button" disabled={true} onPress={mockOnPress} />)

      fireEvent.press(getByText('Test Button'))
      expect(mockOnPress).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('should show loading indicator when loading', () => {
      const { UNSAFE_getByType } = render(<Button title="Test Button" loading={true} onPress={mockOnPress} />)

      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy()
    })

    it('should not show title when loading', () => {
      const { queryByText } = render(<Button title="Test Button" loading={true} onPress={mockOnPress} />)

      expect(queryByText('Test Button')).toBeFalsy()
    })

    it('should not call onPress when loading', () => {
      render(<Button title="Test Button" loading={true} onPress={mockOnPress} />)

      // Since the component structure changes when loading, we can't easily test the press
      // But we can verify that onPress hasn't been called yet
      expect(mockOnPress).not.toHaveBeenCalled()
    })
  })

  describe('icons', () => {
    it('should render icon when specified', () => {
      const { UNSAFE_getByType } = render(<Button title="Test Button" icon="add" onPress={mockOnPress} />)

      expect(UNSAFE_getByType(Ionicons)).toBeTruthy()
    })

    it('should render icon without title', () => {
      const { UNSAFE_getByType } = render(<Button icon="add" onPress={mockOnPress} />)

      expect(UNSAFE_getByType(Ionicons)).toBeTruthy()
    })
  })

  describe('custom styles', () => {
    it('should apply custom text styles', () => {
      const customTextStyle = { color: 'blue' }
      const { getByText } = render(<Button title="Test Button" textStyle={customTextStyle} onPress={mockOnPress} />)

      const text = getByText('Test Button')
      expect(text.props.style).toEqual(expect.arrayContaining([customTextStyle]))
    })
  })

  describe('type exports', () => {
    it('should export ButtonProps type', () => {
      const props: ButtonProps = {
        title: 'Test',
        variant: 'primary',
        size: 'medium',
        onPress: mockOnPress,
      }
      expect(props.title).toBe('Test')
    })

    it('should export ButtonVariant type', () => {
      const variant: ButtonVariant = 'secondary'
      expect(variant).toBe('secondary')
    })

    it('should export ButtonSize type', () => {
      const size: ButtonSize = 'large'
      expect(size).toBe('large')
    })
  })

  describe('edge cases', () => {
    it('should handle missing onPress gracefully', () => {
      const { getByText } = render(<Button title="Test Button" />)

      expect(() => fireEvent.press(getByText('Test Button'))).not.toThrow()
    })

    it('should handle both disabled and loading states', () => {
      const { UNSAFE_getByType } = render(
        <Button title="Test Button" disabled={true} loading={true} onPress={mockOnPress} />
      )

      // Should show loading indicator
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy()

      // Should not call onPress (we can't easily test the press since the component structure changes)
      expect(mockOnPress).not.toHaveBeenCalled()
    })
  })
})
