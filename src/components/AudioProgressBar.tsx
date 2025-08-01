import React, { useState, useCallback, useRef, useEffect } from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated'

import { theme } from '../utils/theme'

export type AudioProgressBarProps = {
  /**
   * Current playback position in seconds
   */
  position: number
  /**
   * Total duration in seconds
   */
  duration: number
  /**
   * Callback when user seeks to a new position
   */
  onSeek: (position: number) => void

  /**
   * Custom styling
   */
  style?: any
}

const SCRUBBER_SIZE = 16
const TRACK_HEIGHT = 3
const TOUCH_TARGET_SIZE = 44

// Utility function to format time in MM:SS format
const formatTime = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Spotify-style audio progress bar with draggable scrubber
 * Features:
 * - Visual progress indication with played/remaining portions
 * - Draggable circular scrubber for seeking
 * - Real-time position updates during playback
 * - Adequate touch target for mobile interaction
 */
export function AudioProgressBar({ position, duration, onSeek, style }: AudioProgressBarProps) {
  const [isScrubbing, setIsScrubbing] = useState(false)
  const containerRef = useRef<View>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Shared values for animations
  const scrubberX = useSharedValue(0)
  const scrubberScale = useSharedValue(1)
  const isScrubbingShared = useSharedValue(false)

  // Safe values with null checks
  const safeDuration = Math.max(duration || 0, 0.1) // Prevent division by zero
  const safePosition = Math.max(position || 0, 0)
  const safeContainerWidth = Math.max(containerWidth, 0)

  // Handle container layout to get width
  const handleLayout = useCallback(
    (event: any) => {
      const { width } = event.nativeEvent.layout
      // Use the layout width directly - it's already the content width excluding padding
      // The track spans the full content width, and scrubber positioning is relative to this
      setContainerWidth(width)

      // Initialize scrubber position immediately when container width is available
      if (width > 0 && safeDuration > 0) {
        const progress = safePosition / safeDuration
        const initialX = progress * width
        scrubberX.value = initialX
      }
    },
    [safePosition, safeDuration]
  )

  // Convert x coordinate to position (worklet-safe)
  const xToPosition = useCallback(
    (x: number) => {
      'worklet'
      if (safeContainerWidth === 0 || safeDuration === 0) return 0
      const clampedX = Math.min(Math.max(x, 0), safeContainerWidth)
      return (clampedX / safeContainerWidth) * safeDuration
    },
    [safeContainerWidth, safeDuration]
  )

  // Callbacks for gesture handler (to avoid closure issues)
  const handleScrubbingStart = useCallback(() => {
    setIsScrubbing(true)
  }, [])

  const handleScrubbingEnd = useCallback(
    (finalPosition: number) => {
      setIsScrubbing(false)
      if (onSeek && finalPosition >= 0 && finalPosition <= safeDuration) {
        // Ensure we only seek to valid positions
        const clampedPosition = Math.min(Math.max(finalPosition, 0), safeDuration)
        onSeek(clampedPosition)
      }
    },
    [onSeek, safeDuration]
  )

  // Store initial scrubber position when gesture starts
  const gestureStartX = useSharedValue(0)

  // Gesture handler for scrubbing
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet'
      isScrubbingShared.value = true
      gestureStartX.value = scrubberX.value // Store current position
      runOnJS(handleScrubbingStart)()
      scrubberScale.value = withSpring(1.2)
    })
    .onUpdate(event => {
      'worklet'
      if (safeContainerWidth === 0 || safeDuration === 0) return

      // Calculate new position based on gesture from the starting position
      // Ensure scrubber stays within bounds (0 to containerWidth)
      const newX = Math.min(Math.max(gestureStartX.value + event.translationX, 0), safeContainerWidth)
      scrubberX.value = newX
    })
    .onEnd(() => {
      'worklet'
      isScrubbingShared.value = false
      const finalPosition = xToPosition(scrubberX.value)
      runOnJS(handleScrubbingEnd)(finalPosition)
      scrubberScale.value = withSpring(1)
    })

  // Initialize scrubber position to 0 when a new clip starts
  useEffect(() => {
    if (safeContainerWidth > 0) {
      // Always start at position 0 for new clips or when position is 0
      if (safePosition === 0) {
        scrubberX.value = 0
      }
    }
  }, [safeContainerWidth, safeDuration, safePosition]) // Reset when duration changes (new clip) or position is 0

  // Update scrubber position during playback when not scrubbing
  useEffect(() => {
    if (!isScrubbing && safeContainerWidth > 0 && safeDuration > 0) {
      const progress = Math.min(Math.max(safePosition / safeDuration, 0), 1) // Clamp progress between 0 and 1
      const targetX = progress * safeContainerWidth
      // Ensure targetX is within bounds (0 to containerWidth)
      const clampedTargetX = Math.min(Math.max(targetX, 0), safeContainerWidth)
      // Use smooth animation with longer duration for fluid movement
      scrubberX.value = withTiming(clampedTargetX, { duration: 200 })
    }
  }, [safePosition, safeContainerWidth, isScrubbing, safeDuration])

  // Derived value for progress width that updates in real-time
  const progressWidthDerived = useDerivedValue(() => {
    if (isScrubbingShared.value) {
      return scrubberX.value
    }
    // Use scrubberX.value for consistent real-time updates
    return scrubberX.value
  })

  // Animated styles
  const scrubberAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: scrubberX.value }, // Direct translation without offset
        { scale: scrubberScale.value },
      ],
    }
  })

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: Math.max(progressWidthDerived.value, 0),
    }
  })

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.container}>
        {/* Progress bar container */}
        <View style={styles.progressBarContainer} onLayout={handleLayout} ref={containerRef}>
          {/* Background track (remaining portion) */}
          <View style={styles.track} />

          {/* Progress track (played portion) */}
          <Animated.View style={[styles.progressTrack, progressAnimatedStyle]} />

          {/* Scrubber with touch target */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.scrubberContainer, scrubberAnimatedStyle]}>
              <View style={styles.touchTarget}>
                <View style={[styles.scrubber, isScrubbing && styles.scrubberActive]} />
              </View>
            </Animated.View>
          </GestureDetector>
        </View>

        <View style={styles.timestampContainer}>
          {/* Current time timestamp */}
          <Text style={styles.timestamp}>{formatTime(safePosition)}</Text>

          {/* Total duration timestamp */}
          <Text style={styles.timestamp}>{formatTime(safeDuration)}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  container: {
    width: '100%',
  },
  progressBarContainer: {
    flex: 1,
    height: TOUCH_TARGET_SIZE,
    justifyContent: 'center',
    paddingHorizontal: SCRUBBER_SIZE / 2,
  },
  timestampContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    position: 'absolute',
    left: SCRUBBER_SIZE / 2,
    right: SCRUBBER_SIZE / 2,
    height: TRACK_HEIGHT,
    backgroundColor: theme.colors.border.medium,
    borderRadius: TRACK_HEIGHT / 2,
  },
  progressTrack: {
    position: 'absolute',
    left: SCRUBBER_SIZE / 2,
    height: TRACK_HEIGHT,
    backgroundColor: theme.colors.primary,
    borderRadius: TRACK_HEIGHT / 2,
  },
  scrubberContainer: {
    position: 'absolute',
    left: SCRUBBER_SIZE / 2, // Start at track beginning
    width: TOUCH_TARGET_SIZE,
    height: TOUCH_TARGET_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchTarget: {
    width: TOUCH_TARGET_SIZE,
    height: TOUCH_TARGET_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrubber: {
    width: SCRUBBER_SIZE,
    height: SCRUBBER_SIZE,
    borderRadius: SCRUBBER_SIZE / 2,
    backgroundColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrubberActive: {
    transform: [{ scale: 1.2 }],
    shadowOpacity: 0.35,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: 'Inter_400Regular',
    minWidth: 35, // Ensure consistent width for timestamps
    textAlign: 'center',
  },
})
