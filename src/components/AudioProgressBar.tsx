import React, { useCallback, useMemo, useRef, useEffect } from 'react'
import { View, StyleSheet, ViewStyle, LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  interpolate,
  Extrapolate,
  withSpring,
  useDerivedValue,
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

  // Calculate progress as a percentage (0-1)
  const progress = useMemo(() => {
    if (!duration || duration <= 0) return 0
    const calculatedProgress = Math.max(0, Math.min(1, currentTime / duration))
    console.log('🎵 AudioProgressBar: Progress calculated -', {
      currentTime,
      duration,
      progress: calculatedProgress,
      percentage: Math.round(calculatedProgress * 100) + '%'
    })
    return calculatedProgress
  }, [currentTime, duration])

  // Create shared values for current time and duration that can be used in worklets
  const sharedCurrentTime = useSharedValue(currentTime)
  const sharedDuration = useSharedValue(duration)

  // Update shared values when props change
  useEffect(() => {
    sharedCurrentTime.value = currentTime
    sharedDuration.value = duration
    console.log('🎵 AudioProgressBar: Updated shared values -', {
      currentTime,
      duration
    })
  }, [currentTime, duration, sharedCurrentTime, sharedDuration])

  // Use derived value for animated progress that updates automatically
  const animatedProgress = useDerivedValue(() => {
    if (isDragging.value) {
      // When dragging, use the drag position
      return dragPosition.value
    } else {
      // When not dragging, calculate progress from current time
      if (!sharedDuration.value || sharedDuration.value <= 0) return 0
      const calculatedProgress = Math.max(0, Math.min(1, sharedCurrentTime.value / sharedDuration.value))
      return withSpring(calculatedProgress, {
        damping: 20,
        stiffness: 100,
      })
    }
  })

  // Handle seeking to a specific position
  const handleSeek = useCallback(
    (position: number) => {
      if (!duration || duration <= 0) return
      const seekTime = Math.max(0, Math.min(duration, position * duration))
      console.log('🎵 AudioProgressBar: Seeking to', seekTime, 'seconds (', Math.round(position * 100), '%)')
      onSeek(seekTime)
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
    console.log('🎵 AudioProgressBar: Pan gesture started')
    isDragging.value = true
    onDragStateChange?.(true)
  }, [onDragStateChange, isDragging])

  const handleDragUpdate = useCallback((position: number) => {
    dragPosition.value = position
    const previewTime = position * duration
    onDragStateChange?.(true, previewTime)
    console.log('🎵 AudioProgressBar: Dragging to position', Math.round(position * 100), '% - preview time:', previewTime.toFixed(1), 's')
  }, [onDragStateChange, duration, dragPosition])

  const handleDragEnd = useCallback((position: number) => {
    console.log('🎵 AudioProgressBar: Pan gesture ended at position', Math.round(position * 100), '%')
    isDragging.value = false
    onDragStateChange?.(false)
    handleSeek(position)
  }, [onDragStateChange, isDragging, handleSeek])

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

    console.log('🎵 AudioProgressBar: Tap gesture at position', Math.round(position * 100), '%')
    runOnJS(handleSeek)(position)
  })

  // Combined gesture
  const combinedGesture = Gesture.Race(panGesture, tapGesture)

  // Animated styles for the progress fill
  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value * 100}%`,
    }
  })

  // Animated styles for the thumb
  const thumbStyle = useAnimatedStyle(() => {
    const scale = isDragging.value ? 1.2 : 1

    return {
      transform: [
        {
          translateX: interpolate(
            animatedProgress.value,
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
          accessibilityLabel={`Audio progress: ${Math.round(progress * 100)}%`}
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
