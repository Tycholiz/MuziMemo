import React, { useCallback, useEffect, useRef } from 'react'
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback, PanResponder } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated'

import { theme } from '@utils/theme'

const { width: screenWidth } = Dimensions.get('window')

export type AudioProgressBarProps = {
  /**
   * Current playback position in seconds
   */
  currentTime: number
  /**
   * Total duration in seconds
   */
  duration: number
  /**
   * Callback when user seeks to a new position
   */
  onSeek: (seconds: number) => void
  /**
   * Whether seeking is disabled
   */
  disabled?: boolean
  /**
   * Custom width (defaults to screen width minus padding)
   */
  width?: number
  /**
   * Custom height for the progress bar
   */
  height?: number
}

const PROGRESS_BAR_HEIGHT = 4
const THUMB_SIZE = 20
const TOUCH_AREA_HEIGHT = 44 // Minimum touch target size for accessibility

/**
 * AudioProgressBar Component
 * 
 * A scrubber/progress bar for audio playback with gesture support.
 * Supports both tap-to-seek and drag-to-seek functionality.
 * Uses react-native-gesture-handler and react-native-reanimated for smooth interactions.
 */
export function AudioProgressBar({
  currentTime,
  duration,
  onSeek,
  disabled = false,
  width = screenWidth - theme.spacing.md * 2,
  height = PROGRESS_BAR_HEIGHT,
}: AudioProgressBarProps) {
  // Shared values for animations
  const progress = useSharedValue(0)
  const isDragging = useSharedValue(false)
  const dragPosition = useSharedValue(0)

  // Refs for debouncing
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0

  // Update progress when currentTime or duration changes (only when not dragging)
  useEffect(() => {
    if (!isDragging.value) {
      progress.value = progressPercentage
    }
  }, [progressPercentage, isDragging.value])

  // Debounced seek function
  const debouncedSeek = useCallback((seekTime: number) => {
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current)
    }
    
    seekTimeoutRef.current = setTimeout(() => {
      onSeek(seekTime)
    }, 100) // 100ms debounce
  }, [onSeek])

  // Handle seeking to a specific position
  const handleSeek = useCallback((position: number) => {
    if (disabled || duration <= 0) return

    // Convert position to time
    const seekTime = Math.min(Math.max(position * duration, 0), duration)
    debouncedSeek(seekTime)
  }, [disabled, duration, debouncedSeek])

  // Pan responder for gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        isDragging.value = true
      },
      onPanResponderMove: (event) => {
        if (disabled) return

        const locationX = event.nativeEvent.locationX
        const newProgress = Math.min(Math.max(locationX / width, 0), 1)
        progress.value = newProgress
        dragPosition.value = newProgress

        handleSeek(newProgress)
      },
      onPanResponderRelease: () => {
        isDragging.value = false
      },
    })
  ).current

  // Handle tap to seek
  const handleTap = useCallback((event: any) => {
    if (disabled || isDragging.value) return

    const locationX = event.nativeEvent.locationX
    const tapProgress = Math.min(Math.max(locationX / width, 0), 1)
    progress.value = tapProgress

    handleSeek(tapProgress)
  }, [disabled, width, handleSeek, isDragging.value])

  // Animated styles for progress bar
  const progressBarStyle = useAnimatedStyle(() => {
    const progressWidth = interpolate(
      progress.value,
      [0, 1],
      [0, width],
      Extrapolate.CLAMP
    )
    
    return {
      width: progressWidth,
    }
  })

  // Animated styles for thumb
  const thumbStyle = useAnimatedStyle(() => {
    const thumbPosition = interpolate(
      progress.value,
      [0, 1],
      [0, width - THUMB_SIZE],
      Extrapolate.CLAMP
    )
    
    const scale = isDragging.value ? 1.2 : 1
    
    return {
      transform: [
        { translateX: thumbPosition },
        { scale },
      ],
    }
  })

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
      }
    }
  }, [])

  return (
    <View style={[styles.container, { width }]}>
      <TouchableWithoutFeedback onPress={handleTap} disabled={disabled}>
        <View style={styles.touchArea} {...panResponder.panHandlers}>
          <View style={[styles.track, { width, height }]}>
            <Animated.View style={[styles.progress, progressBarStyle, { height }]} />
          </View>

          <Animated.View style={[styles.thumb, thumbStyle]} />
        </View>
      </TouchableWithoutFeedback>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: TOUCH_AREA_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchArea: {
    width: '100%',
    height: TOUCH_AREA_HEIGHT,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  track: {
    backgroundColor: theme.colors.border.light,
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
  },
  progress: {
    backgroundColor: theme.colors.secondary, // Blue progress color
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: theme.colors.secondary, // Blue thumb color
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
})
