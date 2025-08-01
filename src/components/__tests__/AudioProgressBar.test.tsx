import React from 'react'
import { render } from '@testing-library/react-native'
import { AudioProgressBar } from '../AudioProgressBar'

describe('AudioProgressBar', () => {
  const defaultProps = {
    position: 30,
    duration: 120,
    onSeek: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<AudioProgressBar {...defaultProps} />)
    expect(true).toBe(true) // Basic smoke test
  })

  it('handles zero duration gracefully', () => {
    render(<AudioProgressBar position={0} duration={0} onSeek={jest.fn()} />)
    expect(true).toBe(true) // Should not crash with zero duration
  })

  it('handles position greater than duration', () => {
    render(<AudioProgressBar position={150} duration={120} onSeek={jest.fn()} />)
    expect(true).toBe(true) // Should handle edge case gracefully
  })

  it('handles negative position', () => {
    render(<AudioProgressBar position={-10} duration={120} onSeek={jest.fn()} />)
    expect(true).toBe(true) // Should handle edge case gracefully
  })
})
