import React, { useState, useCallback, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
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
  const progressWidth = useSharedValue(0)

  // Calculate progress percentage
  const progress = duration > 0 ? Math.min(Math.max(position / duration, 0), 1) : 0

  // Handle container layout to get width
  const handleLayout = useCallback((event: any) => {
    const { width } = event.nativeEvent.layout
    setContainerWidth(width - SCRUBBER_SIZE) // Account for scrubber size
  }, [])

  // Convert position to x coordinate
  const positionToX = useCallback(
    (pos: number) => {
      if (containerWidth === 0 || duration === 0) return 0
      return (pos / duration) * containerWidth
    },
    [containerWidth, duration]
  )

  // Convert x coordinate to position
  const xToPosition = useCallback(
    (x: number) => {
      if (containerWidth === 0) return 0
      const clampedX = Math.min(Math.max(x, 0), containerWidth)
      return (clampedX / containerWidth) * duration
    },
    [containerWidth, duration]
  )

  // Gesture handler for scrubbing
  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(setIsScrubbing)(true)
      scrubberScale.value = withSpring(1.2)
    })
    .onUpdate((event) => {
      if (containerWidth === 0) return

      const startX = positionToX(position)
      const newX = Math.min(Math.max(startX + event.translationX, 0), containerWidth)
      scrubberX.value = newX
      progressWidth.value = newX
    })
    .onEnd(() => {
      runOnJS(setIsScrubbing)(false)
      const finalPosition = xToPosition(scrubberX.value)
      runOnJS(onSeek)(finalPosition)
      scrubberScale.value = withSpring(1)
    })

  // Update scrubber position when not scrubbing
  React.useEffect(() => {
    if (!isScrubbing && containerWidth > 0) {
      const targetX = positionToX(position)
      scrubberX.value = withTiming(targetX, { duration: 100 })
      progressWidth.value = withTiming(targetX, { duration: 100 })
    }
  }, [position, containerWidth, isScrubbing, positionToX])

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
      width: isScrubbing ? progressWidth.value : progress * containerWidth
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
