import React, { useState, useCallback, useRef } from 'react'
import { View, PanResponder, StyleSheet, Animated } from 'react-native'

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
  const [scrubbingPosition, setScrubbingPosition] = useState(0)
  const containerRef = useRef<View>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Animated values
  const scrubberX = useRef(new Animated.Value(0)).current
  const scrubberScale = useRef(new Animated.Value(1)).current

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

  // Pan responder for scrubbing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsScrubbing(true)
        // Scale up scrubber for visual feedback
        Animated.spring(scrubberScale, {
          toValue: 1.2,
          useNativeDriver: true,
        }).start()
      },
      onPanResponderMove: (_, gestureState) => {
        // Get current value safely
        let currentX = 0
        scrubberX.addListener(({ value }) => { currentX = value })
        scrubberX.removeAllListeners()

        const newX = Math.min(Math.max(gestureState.dx, -currentX), containerWidth - currentX)
        const targetX = currentX + newX
        const clampedX = Math.min(Math.max(targetX, 0), containerWidth)

        scrubberX.setValue(clampedX)
        setScrubbingPosition(xToPosition(clampedX))
      },
      onPanResponderRelease: () => {
        setIsScrubbing(false)
        // Get current value safely
        let currentX = 0
        scrubberX.addListener(({ value }) => { currentX = value })
        scrubberX.removeAllListeners()

        const finalPosition = xToPosition(currentX)
        onSeek(finalPosition)

        // Scale back scrubber
        Animated.spring(scrubberScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start()
      },
    })
  ).current

  // Update scrubber position when not scrubbing
  React.useEffect(() => {
    if (!isScrubbing && containerWidth > 0) {
      const targetX = positionToX(position)
      Animated.timing(scrubberX, {
        toValue: targetX,
        duration: 100,
        useNativeDriver: false,
      }).start()
    }
  }, [position, containerWidth, isScrubbing, positionToX])

  return (
    <View style={[styles.container, style]} onLayout={handleLayout} ref={containerRef}>
      {/* Background track (remaining portion) */}
      <View style={styles.track} />

      {/* Progress track (played portion) */}
      <Animated.View
        style={[
          styles.progressTrack,
          {
            width: isScrubbing
              ? (scrubbingPosition / duration) * containerWidth
              : (progress * containerWidth)
          }
        ]}
      />

      {/* Scrubber with touch target */}
      <Animated.View
        style={[
          styles.scrubberContainer,
          {
            transform: [
              { translateX: scrubberX },
              { scale: scrubberScale }
            ]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.touchTarget}>
          <View style={[styles.scrubber, isScrubbing && styles.scrubberActive]} />
        </View>
      </Animated.View>
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
