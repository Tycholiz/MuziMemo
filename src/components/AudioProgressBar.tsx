import React, { useCallback, useMemo, useRef } from 'react'
import { View, StyleSheet, ViewStyle, LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated'

import { theme } from '@utils/theme'

export type AudioProgressBarProps = {
  currentTime: number
  duration: number
  onSeek: (position: number) => void
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
  style,
}: AudioProgressBarProps) {
  const isDragging = useSharedValue(false)
  const dragPosition = useSharedValue(0)
  const trackWidth = useSharedValue(0)
  const trackLayoutRef = useRef<View>(null)

  // Calculate progress as a percentage (0-1)
  const progress = useMemo(() => {
    if (!duration || duration <= 0) return 0
    return Math.max(0, Math.min(1, currentTime / duration))
  }, [currentTime, duration])

  // Handle seeking to a specific position
  const handleSeek = useCallback(
    (position: number) => {
      if (!duration || duration <= 0) return
      const seekTime = Math.max(0, Math.min(duration, position * duration))
      onSeek(seekTime)
    },
    [duration, onSeek]
  )

  // Handle track layout to get accurate width
  const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
    trackWidth.value = event.nativeEvent.layout.width
  }, [trackWidth])

  // Pan gesture for dragging the thumb
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true
    })
    .onUpdate((event) => {
      // Calculate position based on gesture location within the track
      const position = Math.max(0, Math.min(1, event.x / trackWidth.value))
      dragPosition.value = position
    })
    .onEnd(() => {
      isDragging.value = false
      runOnJS(handleSeek)(dragPosition.value)
    })

  // Tap gesture for tap-to-seek
  const tapGesture = Gesture.Tap().onEnd((event) => {
    const position = Math.max(0, Math.min(1, event.x / trackWidth.value))
    runOnJS(handleSeek)(position)
  })

  // Combined gesture
  const combinedGesture = Gesture.Race(panGesture, tapGesture)

  // Animated styles for the progress fill
  const progressStyle = useAnimatedStyle(() => {
    const currentProgress = isDragging.value ? dragPosition.value : progress
    return {
      width: `${currentProgress * 100}%`,
    }
  })

  // Animated styles for the thumb
  const thumbStyle = useAnimatedStyle(() => {
    const currentProgress = isDragging.value ? dragPosition.value : progress
    const scale = isDragging.value ? 1.2 : 1

    return {
      transform: [
        {
          translateX: interpolate(
            currentProgress,
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
