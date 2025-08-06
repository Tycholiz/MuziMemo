import React, { useCallback, useMemo, useRef, useEffect } from 'react'
import { View, StyleSheet, ViewStyle, LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  interpolate,
  Extrapolate,
  useDerivedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'

import { theme } from '@utils/theme'

export type AudioProgressBarProps = {
  currentTime: number
  duration: number
  onSeek: (position: number) => void
  onDragStateChange?: (isDragging: boolean, previewTime?: number) => void
  style?: ViewStyle
}

const TRACK_HEIGHT = 4
const THUMB_SIZE = 20
const TOUCH_AREA_HEIGHT = 44

/**
 * Audio Progress Bar Component
 * Provides a draggable progress bar for audio playback with tap-to-seek and drag-to-seek functionality
 */
export function AudioProgressBar({
  currentTime,
  duration,
  onSeek,
  onDragStateChange,
  style,
}: AudioProgressBarProps) {
  const isDragging = useSharedValue(false)
  const dragPosition = useSharedValue(0)
  const trackWidth = useSharedValue(0)
  const trackLayoutRef = useRef<View>(null)



  // Shared values for smooth animation on UI thread
  const animatedProgress = useSharedValue(0)
  const lastKnownProgress = useSharedValue(0)
  const isUserInteracting = useSharedValue(false)

  // Manual position override for immediate user control
  const manualPosition = useSharedValue<number | null>(null)

  // Calculate current progress from props
  const currentProgress = useMemo(() => {
    if (!duration || duration <= 0) return 0
    return Math.max(0, Math.min(1, currentTime / duration))
  }, [currentTime, duration])

  // Update animated progress with smooth interpolation
  useEffect(() => {
    const newProgress = currentProgress

    console.log('🎵 AudioProgressBar: Progress update -', {
      currentTime,
      duration,
      newProgress: Math.round(newProgress * 100),
      lastProgress: Math.round(lastKnownProgress.value * 100),
      isUserInteracting: isUserInteracting.value,
      hasManualOverride: manualPosition.value !== null
    })

    // Only animate if user is not currently interacting and no manual override
    if (!isUserInteracting.value && manualPosition.value === null) {
      // Use smooth timing animation for 60fps interpolation
      animatedProgress.value = withTiming(newProgress, {
        duration: 100, // Match the update interval for smooth animation
        easing: Easing.linear,
      })
    }

    lastKnownProgress.value = newProgress
  }, [currentProgress, animatedProgress, lastKnownProgress, isUserInteracting, manualPosition])

  // Derived value for final progress calculation
  const finalProgress = useDerivedValue(() => {
    // If we have a manual position override (during/after user interaction), use it
    if (manualPosition.value !== null) {
      console.log('🎵 AudioProgressBar: Using manual position -', Math.round(manualPosition.value * 100), '%')
      return manualPosition.value
    }

    // Otherwise, use the smoothly animated progress
    return animatedProgress.value
  })

  // Handle seeking to a specific position
  const handleSeek = useCallback(
    async (position: number) => {
      if (!duration || duration <= 0) return
      const seekTime = Math.max(0, Math.min(duration, position * duration))
      console.log('🎵 AudioProgressBar: Seeking to', seekTime, 'seconds (', Math.round(position * 100), '%)')

      try {
        await onSeek(seekTime)
        console.log('🎵 AudioProgressBar: Seek operation completed successfully')
      } catch (error) {
        console.error('🎵 AudioProgressBar: Error during seek operation:', error)
      }
    },
    [duration, onSeek]
  )

  // Handle track layout to get accurate width
  const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    trackWidth.value = width
    console.log('🎵 AudioProgressBar: Track width set to', width)
  }, [trackWidth])

  // Handle drag state changes
  const handleDragStart = useCallback(() => {
    console.log('🎵 AudioProgressBar: Pan gesture started - pausing smooth animation')

    isDragging.value = true
    isUserInteracting.value = true
    onDragStateChange?.(true)
  }, [onDragStateChange, isDragging, isUserInteracting])

  const handleDragUpdate = useCallback((position: number) => {
    dragPosition.value = position

    // Set manual position override for immediate positioning
    manualPosition.value = position

    const previewTime = position * duration
    onDragStateChange?.(true, previewTime)
    console.log('🎵 AudioProgressBar: Dragging to position', Math.round(position * 100), '% - preview time:', previewTime.toFixed(1), 's')
  }, [onDragStateChange, duration, dragPosition, manualPosition])

  const handleDragEnd = useCallback(async (position: number) => {
    console.log('🎵 AudioProgressBar: Pan gesture ended at position', Math.round(position * 100), '% - performing seek operation')

    // Keep manual position for immediate final positioning
    manualPosition.value = position

    isDragging.value = false
    onDragStateChange?.(false)

    // Perform the seek operation and wait for it to complete
    try {
      await handleSeek(position)
      console.log('🎵 AudioProgressBar: Drag-to-seek completed successfully')
    } catch (error) {
      console.error('🎵 AudioProgressBar: Error during drag-to-seek:', error)
    }

    // Clear manual override and resume smooth animation after seek completes
    // Use a longer delay to ensure the audio player has updated its position
    setTimeout(() => {
      manualPosition.value = null
      isUserInteracting.value = false
      console.log('🎵 AudioProgressBar: Manual override cleared - smooth animation resumed')
    }, 200) // Longer delay to ensure seek operation fully completes
  }, [onDragStateChange, isDragging, handleSeek, manualPosition, isUserInteracting])

  // Pan gesture for dragging the thumb
  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(handleDragStart)()
    })
    .onUpdate((event) => {
      if (trackWidth.value <= 0) return

      // Account for the padding in the touch area
      // The actual track starts at THUMB_SIZE/2 from the left edge of the touch area
      const adjustedX = event.x - (THUMB_SIZE / 2)
      const actualTrackWidth = trackWidth.value
      const position = Math.max(0, Math.min(1, adjustedX / actualTrackWidth))

      runOnJS(handleDragUpdate)(position)
    })
    .onEnd(() => {
      runOnJS(handleDragEnd)(dragPosition.value)
    })

  // Tap gesture for tap-to-seek
  const tapGesture = Gesture.Tap().onEnd((event) => {
    if (trackWidth.value <= 0) return

    // Account for the padding in the touch area
    const adjustedX = event.x - (THUMB_SIZE / 2)
    const actualTrackWidth = trackWidth.value
    const position = Math.max(0, Math.min(1, adjustedX / actualTrackWidth))

    console.log('🎵 AudioProgressBar: Tap gesture at position', Math.round(position * 100), '% - performing seek operation')

    // Pause smooth animation during tap-to-seek
    isUserInteracting.value = true

    // Set manual position override for immediate positioning
    manualPosition.value = position

    // Perform the seek operation
    runOnJS(async () => {
      try {
        await handleSeek(position)
        console.log('🎵 AudioProgressBar: Tap-to-seek completed successfully')
      } catch (error) {
        console.error('🎵 AudioProgressBar: Error during tap-to-seek:', error)
      }

      // Clear manual override and resume smooth animation after seek completes
      setTimeout(() => {
        manualPosition.value = null
        isUserInteracting.value = false
        console.log('🎵 AudioProgressBar: Tap seek completed - smooth animation resumed')
      }, 200)
    })()
  })

  // Combined gesture
  const combinedGesture = Gesture.Race(panGesture, tapGesture)

  // Animated styles for the progress fill
  const progressStyle = useAnimatedStyle(() => {
    const progress = finalProgress.value
    return {
      width: `${progress * 100}%`,
    }
  })

  // Animated styles for the thumb
  const thumbStyle = useAnimatedStyle(() => {
    const scale = isDragging.value ? 1.2 : 1
    const progress = finalProgress.value

    return {
      transform: [
        {
          translateX: interpolate(
            progress,
            [0, 1],
            [0, trackWidth.value - THUMB_SIZE],
            Extrapolate.CLAMP
          ),
        },
        { scale },
      ],
    }
  })

  return (
    <View style={[styles.container, style]}>
      <GestureDetector gesture={combinedGesture}>
        <View
          style={styles.touchArea}
          accessible={true}
          accessibilityRole="adjustable"
          accessibilityLabel={`Audio progress: ${Math.round(currentProgress * 100)}%`}
          accessibilityHint="Drag to seek or tap to jump to position"
          accessibilityValue={{
            min: 0,
            max: duration,
            now: currentTime,
          }}
        >
          {/* Background track */}
          <View
            style={styles.track}
            onLayout={handleTrackLayout}
            ref={trackLayoutRef}
          >
            {/* Progress fill */}
            <Animated.View style={[styles.progressFill, progressStyle]} />

            {/* Draggable thumb */}
            <Animated.View style={[styles.thumb, thumbStyle]} />
          </View>
        </View>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: theme.spacing.md,
  },
  touchArea: {
    height: TOUCH_AREA_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: THUMB_SIZE / 2,
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: theme.colors.border.light,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'relative',
  },
  progressFill: {
    height: TRACK_HEIGHT,
    backgroundColor: theme.colors.secondary, // Blue color
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: theme.colors.secondary, // Blue color
    borderRadius: THUMB_SIZE / 2,
    position: 'absolute',
    top: -((THUMB_SIZE - TRACK_HEIGHT) / 2),
    left: -THUMB_SIZE / 2,
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
