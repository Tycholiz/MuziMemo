import React, { useState, useCallback, useEffect } from 'react'
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
 * Interactive progress bar with scrubbing functionality for audio playback
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

  // Use scrub position when user is dragging, otherwise use current time
  const displayTime = isScrubbing ? scrubPosition : currentTime

  // Handle slider value changes during scrubbing
  const handleValueChange = useCallback((value: number) => {
    setScrubPosition(value)
  }, [])

  // Handle when user starts scrubbing
  const handleSlidingStart = useCallback(() => {
    setIsScrubbing(true)
  }, [])

  // Handle when user finishes scrubbing
  const handleSlidingComplete = useCallback(
    (value: number) => {
      setIsScrubbing(false)
      onSeek(value)
    },
    [onSeek]
  )

  // Reset scrub state if currentTime changes externally while not scrubbing
  useEffect(() => {
    if (!isScrubbing) {
      setScrubPosition(currentTime)
    }
  }, [currentTime, isScrubbing])

  // Handle edge cases
  const safeDuration = duration > 0 ? duration : 0
  const safeCurrentTime = Math.max(0, Math.min(displayTime, safeDuration))

  // Format time labels
  const currentTimeLabel = formatDurationSmart(safeCurrentTime)
  const durationLabel = formatDurationSmart(safeDuration)

  return (
    <View style={[styles.container, style]}>
      {/* Progress Slider */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={safeDuration}
          value={safeCurrentTime}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          onSlidingComplete={handleSlidingComplete}
          disabled={disabled || safeDuration === 0}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.surface.secondary}
          thumbTintColor={theme.colors.primary}
        />
      </View>

      {/* Time Labels */}
      <View style={styles.timeLabelsContainer}>
        <Text style={styles.timeLabel}>{currentTimeLabel}</Text>
        <Text style={styles.timeLabel}>{durationLabel}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
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
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.medium,
  },
})
