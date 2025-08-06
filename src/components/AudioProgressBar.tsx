import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { Slider } from 'react-native-awesome-slider'
import { useSharedValue } from 'react-native-reanimated'

import { theme } from '@utils/theme'
import { formatAudioDuration } from '@utils/formatUtils'

export type AudioProgressBarProps = {
  currentTime: number
  duration: number
  onSeek: (position: number) => void
  disabled?: boolean
  style?: ViewStyle
}

/**
 * AudioProgressBar Component
 * Interactive progress bar for audio playback with scrubbing support
 * 
 * Features:
 * - Real-time position updates during playback
 * - Interactive scrubbing with immediate visual feedback
 * - Time labels that update during scrubbing
 * - Proper handling of edge cases (zero duration, invalid positions)
 * - Theme integration and accessibility support
 */
export function AudioProgressBar({
  currentTime,
  duration,
  onSeek,
  disabled = false,
  style,
}: AudioProgressBarProps) {
  // State for tracking if user is currently scrubbing
  const [isScrubbing, setIsScrubbing] = useState(false)
  // State for the position while user is dragging (for time label updates)
  const [scrubPosition, setScrubPosition] = useState(0)

  // Shared values for react-native-awesome-slider
  const progress = useSharedValue(0)
  const min = useSharedValue(0)
  const max = useSharedValue(duration || 1)

  // Update slider values when duration or currentTime changes
  useEffect(() => {
    if (!isScrubbing) {
      // Only update if user is not currently scrubbing
      max.value = duration || 1
      progress.value = currentTime || 0
    }
  }, [currentTime, duration, isScrubbing, max, progress])

  // Handle slider value changes (while dragging)
  const handleValueChange = useCallback((value: number) => {
    setScrubPosition(value)
  }, [])

  // Handle when user starts dragging
  const handleSlidingStart = useCallback(() => {
    setIsScrubbing(true)
  }, [])

  // Handle when user finishes dragging
  const handleSlidingComplete = useCallback((value: number) => {
    setIsScrubbing(false)
    setScrubPosition(0)
    onSeek(value)
  }, [onSeek])

  // Calculate display values
  const displayCurrentTime = isScrubbing ? scrubPosition : currentTime
  const displayDuration = duration || 0

  // Handle edge cases
  const isValidDuration = duration && duration > 0
  const sliderDisabled = disabled || !isValidDuration

  return (
    <View style={[styles.container, style]}>
      {/* Progress Slider */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          progress={progress}
          minimumValue={min}
          maximumValue={max}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          onSlidingComplete={handleSlidingComplete}
          disable={sliderDisabled}
          theme={{
            disableMinTrackTintColor: theme.colors.gray[600],
            maximumTrackTintColor: theme.colors.gray[600],
            minimumTrackTintColor: theme.colors.primary,
            cacheTrackTintColor: theme.colors.gray[700],
            bubbleBackgroundColor: theme.colors.primary,
            heartbeatColor: theme.colors.primary,
          }}
          thumbWidth={16}
          renderBubble={() => null} // Hide the bubble for cleaner look
        />
      </View>

      {/* Time Labels */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {formatAudioDuration(displayCurrentTime)}
        </Text>
        <Text style={styles.timeText}>
          {formatAudioDuration(displayDuration)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
  },
  sliderContainer: {
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  slider: {
    height: 40, // Adequate touch target
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  timeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fontFamily.regular,
    fontWeight: theme.typography.fontWeight.normal,
  },
})
