import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import Slider from '@react-native-community/slider'

import { theme } from '@utils/theme'
import { formatDurationSmart } from '@utils/formatUtils'

export type AudioProgressBarProps = {
  currentTime: number
  duration: number
  onSeek: (position: number) => void
  disabled?: boolean
  style?: ViewStyle
}

/**
 * AudioProgressBar Component
 * Interactive progress bar for audio playback with scrubbing functionality
 * Shows current time and total duration with smart formatting (MM:SS or HH:MM:SS)
 */
export function AudioProgressBar({
  currentTime,
  duration,
  onSeek,
  disabled = false,
  style,
}: AudioProgressBarProps) {
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [scrubPosition, setScrubPosition] = useState(0)

  // Handle edge cases
  const safeDuration = duration > 0 ? duration : 0
  const safeCurrentTime = Math.max(0, Math.min(currentTime, safeDuration))

  // Calculate slider value (0-1)
  const sliderValue = safeDuration > 0 ? safeCurrentTime / safeDuration : 0

  // Format time labels - use smart formatting based on total duration
  const formatTime = useCallback((seconds: number) => {
    return formatDurationSmart(Math.max(0, seconds))
  }, [])

  // Display time for current position (either actual current time or scrub position)
  const displayCurrentTime = isScrubbing ? scrubPosition : safeCurrentTime
  const currentTimeLabel = formatTime(displayCurrentTime)
  const durationLabel = formatTime(safeDuration)

  // Handle scrubbing start
  const handleSlidingStart = useCallback(() => {
    setIsScrubbing(true)
    setScrubPosition(safeCurrentTime)
  }, [safeCurrentTime])

  // Handle scrubbing (value change during drag)
  const handleValueChange = useCallback((value: number) => {
    if (isScrubbing && safeDuration > 0) {
      const newPosition = value * safeDuration
      setScrubPosition(newPosition)
    }
  }, [isScrubbing, safeDuration])

  // Handle scrubbing end
  const handleSlidingComplete = useCallback((value: number) => {
    setIsScrubbing(false)
    if (safeDuration > 0) {
      const newPosition = value * safeDuration
      onSeek(newPosition)
    }
  }, [safeDuration, onSeek])

  return (
    <View style={[styles.container, style]}>
      {/* Progress Slider */}
      <Slider
        style={styles.slider}
        value={sliderValue}
        minimumValue={0}
        maximumValue={1}
        onSlidingStart={handleSlidingStart}
        onValueChange={handleValueChange}
        onSlidingComplete={handleSlidingComplete}
        disabled={disabled || safeDuration === 0}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={theme.colors.border.light}
        thumbTintColor={theme.colors.primary}
        testID="audio-progress-slider"
      />

      {/* Time Labels */}
      <View style={styles.timeLabelsContainer}>
        <Text style={styles.timeLabel} testID="current-time-label">
          {currentTimeLabel}
        </Text>
        <Text style={styles.timeLabel} testID="duration-label">
          {durationLabel}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  timeLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
})
