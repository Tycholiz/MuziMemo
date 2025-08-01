import React, { useState, useCallback, useRef, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
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

/**
 * Spotify-style audio progress bar with draggable scrubber
 * Features:
 * - Visual progress indication with played/remaining portions
 * - Draggable circular scrubber for seeking
 * - Real-time position updates during playback
 * - Adequate touch target for mobile interaction
 */
export function AudioProgressBar({
  position,
  duration,
  onSeek,
  style,
}: AudioProgressBarProps) {
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

  // Calculate progress percentage with immediate initial value
  const progress = safeDuration > 0 ? Math.min(Math.max(safePosition / safeDuration, 0), 1) : 0

  // Handle container layout to get width
  const handleLayout = useCallback((event: any) => {
    const { width } = event.nativeEvent.layout
    const newWidth = Math.max(width - SCRUBBER_SIZE, 0) // Account for scrubber size
    setContainerWidth(newWidth)

    // Initialize scrubber position immediately when container width is available
    if (newWidth > 0 && safeDuration > 0) {
      const initialX = (safePosition / safeDuration) * newWidth
      scrubberX.value = initialX
    }
  }, [safePosition, safeDuration])



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

  const handleScrubbingEnd = useCallback((finalPosition: number) => {
    setIsScrubbing(false)
    if (onSeek && finalPosition >= 0) {
      onSeek(Math.min(Math.max(finalPosition, 0), safeDuration))
    }
  }, [onSeek, safeDuration])

  // Gesture handler for scrubbing
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet'
      isScrubbingShared.value = true
      runOnJS(handleScrubbingStart)()
      scrubberScale.value = withSpring(1.2)
    })
    .onUpdate((event) => {
      'worklet'
      if (safeContainerWidth === 0 || safeDuration === 0) return

      // Calculate new position based on gesture
      const currentProgress = safePosition / safeDuration
      const startX = currentProgress * safeContainerWidth
      const newX = Math.min(Math.max(startX + event.translationX, 0), safeContainerWidth)

      scrubberX.value = newX
    })
    .onEnd(() => {
      'worklet'
      isScrubbingShared.value = false
      const finalPosition = xToPosition(scrubberX.value)
      runOnJS(handleScrubbingEnd)(finalPosition)
      scrubberScale.value = withSpring(1)
    })

  // Update scrubber position when not scrubbing - with immediate initial render
  useEffect(() => {
    if (!isScrubbing && safeContainerWidth > 0 && safeDuration > 0) {
      const targetX = (safePosition / safeDuration) * safeContainerWidth
      scrubberX.value = withTiming(targetX, { duration: 100 })
    }
  }, [safePosition, safeContainerWidth, isScrubbing, safeDuration])

  // Initialize scrubber position immediately when component mounts
  useEffect(() => {
    if (safeContainerWidth > 0 && safeDuration > 0) {
      const initialX = (safePosition / safeDuration) * safeContainerWidth
      scrubberX.value = initialX
    }
  }, [safeContainerWidth, safeDuration]) // Only run when container width or duration changes

  // Derived value for progress width that updates in real-time
  const progressWidthDerived = useDerivedValue(() => {
    if (isScrubbingShared.value) {
      return scrubberX.value
    }
    return progress * safeContainerWidth
  }, [progress, safeContainerWidth])

  // Animated styles
  const scrubberAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: scrubberX.value },
        { scale: scrubberScale.value }
      ]
    }
  })

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: Math.max(progressWidthDerived.value, 0)
    }
  })

  return (
    <View style={[styles.container, style]} onLayout={handleLayout} ref={containerRef}>
      {/* Background track (remaining portion) */}
      <View style={styles.track} />

      {/* Progress track (played portion) */}
      <Animated.View
        style={[
          styles.progressTrack,
          progressAnimatedStyle
        ]}
      />

      {/* Scrubber with touch target */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.scrubberContainer,
            scrubberAnimatedStyle
          ]}
        >
          <View style={styles.touchTarget}>
            <View style={[styles.scrubber, isScrubbing && styles.scrubberActive]} />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: TOUCH_TARGET_SIZE,
    justifyContent: 'center',
    paddingHorizontal: SCRUBBER_SIZE / 2,
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
})
