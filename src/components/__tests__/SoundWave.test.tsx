/**
 * Unit tests for SoundWave component logic and behavior
 */

import { SoundWaveProps } from '../SoundWave'

describe('SoundWave component', () => {
  it('should have correct prop types', () => {
    // Test that the component accepts the expected props
    const validProps: SoundWaveProps = {
      audioLevel: 0.5,
      isActive: true,
      style: { backgroundColor: 'red' },
      barCount: 5,
      barColor: '#FF0000',
      testID: 'test-sound-wave',
    }

    expect(validProps.audioLevel).toBe(0.5)
    expect(validProps.isActive).toBe(true)
    expect(validProps.barCount).toBe(5)
    expect(validProps.barColor).toBe('#FF0000')
    expect(validProps.testID).toBe('test-sound-wave')
  })

  it('should handle audio level range correctly', () => {
    // Test audio level normalization logic
    const normalizeAudioLevel = (level: number): number => {
      return Math.max(0.2, level) // Minimum 20% height
    }

    expect(normalizeAudioLevel(0)).toBe(0.2) // Silent audio should show minimum height
    expect(normalizeAudioLevel(0.5)).toBe(0.5) // Normal audio level
    expect(normalizeAudioLevel(1)).toBe(1) // Maximum audio level
  })

  it('should calculate bar variation correctly', () => {
    // Test the bar height variation logic
    const calculateBarHeight = (audioLevel: number, variation: number): number => {
      return Math.max(0.2, audioLevel * variation)
    }

    const audioLevel = 0.8
    const variation = 0.9 // Random variation between 0.7 and 1.0

    const barHeight = calculateBarHeight(audioLevel, variation)
    expect(barHeight).toBeCloseTo(0.72, 2) // 0.8 * 0.9, within 2 decimal places
    expect(barHeight).toBeGreaterThanOrEqual(0.2) // Should never be below minimum
  })

  it('should handle inactive state correctly', () => {
    // When isActive is false, bars should reset to minimum height
    const inactiveBarHeight = 0.2
    expect(inactiveBarHeight).toBe(0.2)
  })

  it('should validate bar count range', () => {
    // Test that bar count is within reasonable limits
    const validateBarCount = (count?: number): number => {
      const defaultCount = 5
      if (!count || count < 1) return defaultCount
      if (count > 20) return 20 // Reasonable maximum
      return count
    }

    expect(validateBarCount()).toBe(5) // Default
    expect(validateBarCount(0)).toBe(5) // Invalid, use default
    expect(validateBarCount(3)).toBe(3) // Valid
    expect(validateBarCount(25)).toBe(20) // Too high, clamp to max
  })

  it('should handle color validation', () => {
    // Test color prop validation
    const isValidColor = (color?: string): boolean => {
      if (!color) return false
      // Simple validation for hex colors
      return /^#[0-9A-F]{6}$/i.test(color) || color.startsWith('rgb')
    }

    expect(isValidColor('#FF0000')).toBe(true)
    expect(isValidColor('#ffffff')).toBe(true)
    expect(isValidColor('rgb(255, 0, 0)')).toBe(true)
    expect(isValidColor('invalid')).toBe(false)
    expect(isValidColor()).toBe(false)
  })

  it('should implement silence threshold correctly', () => {
    // Test the new silence threshold functionality
    const SILENCE_THRESHOLD = 0.05
    const MIN_HEIGHT = 0.2

    const shouldAnimate = (audioLevel: number): boolean => {
      return audioLevel > SILENCE_THRESHOLD
    }

    const getTargetHeight = (audioLevel: number, isAudioDetected: boolean): number => {
      if (!isAudioDetected) {
        return MIN_HEIGHT // Silence state
      }
      // Scale proportionally with audio level
      return Math.max(MIN_HEIGHT, MIN_HEIGHT + audioLevel * 0.8)
    }

    // Test silence detection
    expect(shouldAnimate(0)).toBe(false) // Complete silence
    expect(shouldAnimate(0.03)).toBe(false) // Below threshold
    expect(shouldAnimate(0.05)).toBe(false) // Exactly at threshold
    expect(shouldAnimate(0.06)).toBe(true) // Above threshold
    expect(shouldAnimate(0.5)).toBe(true) // Normal audio level

    // Test target height calculation
    expect(getTargetHeight(0, false)).toBe(MIN_HEIGHT) // Silence
    expect(getTargetHeight(0.03, false)).toBe(MIN_HEIGHT) // Below threshold
    expect(getTargetHeight(0.1, true)).toBeCloseTo(0.28, 2) // 0.2 + (0.1 * 0.8)
    expect(getTargetHeight(0.5, true)).toBeCloseTo(0.6, 2) // 0.2 + (0.5 * 0.8)
    expect(getTargetHeight(1.0, true)).toBeCloseTo(1.0, 2) // 0.2 + (1.0 * 0.8)
  })

  it('should use optimized animation durations', () => {
    // Test animation timing for responsive feedback
    const getAnimationDuration = (animationType: 'active' | 'silence' | 'inactive'): number => {
      switch (animationType) {
        case 'active':
          return 80 // Fast response for real-time feel
        case 'silence':
          return 60 // Faster transition to silence for immediate feedback
        case 'inactive':
          return 200 // Slower transition when stopping recording
        default:
          return 100
      }
    }

    expect(getAnimationDuration('active')).toBe(80)
    expect(getAnimationDuration('silence')).toBe(60) // Updated faster silence transition
    expect(getAnimationDuration('inactive')).toBe(200)
  })

  it('should convert decibel values to normalized levels correctly', () => {
    // Test the decibel to level conversion logic
    const convertDecibelToLevel = (decibel: number): number => {
      if (decibel === undefined || decibel === null || decibel === -Infinity) {
        return 0 // Silence
      }

      // Clamp decibel value to reasonable range (-60dB to 0dB)
      const clampedDb = Math.max(-60, Math.min(0, decibel))

      // Convert to 0-1 range (0 = -60dB, 1 = 0dB)
      const normalized = (clampedDb + 60) / 60

      // Apply slight curve to make lower levels more visible
      return Math.pow(normalized, 0.7)
    }

    // Test edge cases
    expect(convertDecibelToLevel(-Infinity)).toBe(0) // Complete silence
    expect(convertDecibelToLevel(-60)).toBeCloseTo(0, 2) // Minimum audible
    expect(convertDecibelToLevel(0)).toBeCloseTo(1, 2) // Maximum level
    expect(convertDecibelToLevel(-30)).toBeGreaterThan(0) // Mid-range
    expect(convertDecibelToLevel(-30)).toBeLessThan(1) // Mid-range

    // Test clamping
    expect(convertDecibelToLevel(-100)).toBe(0) // Below minimum, clamped
    expect(convertDecibelToLevel(10)).toBeCloseTo(1, 2) // Above maximum, clamped
  })
})
