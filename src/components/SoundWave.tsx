import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, ViewStyle, Easing } from 'react-native'

import { theme } from '@utils/theme'

export type SoundWaveProps = {
  audioLevel: number
  isActive: boolean
  style?: ViewStyle
  barCount?: number
  barColor?: string
  testID?: string
}

/**
 * SoundWave component that displays animated sound waves
 * Responds to real-time audio input levels during recording
 *
 * When audioLevel is below threshold (silence), bars remain at minimum height (20%)
 * When audioLevel increases (louder sound), bars animate to higher heights proportionally
 * Animation intensity scales with actual microphone input volume
 * Smooth transitions prevent jarring visual changes
 * Each bar has slight random variation for a more realistic visual effect
 */
export function SoundWave({
  audioLevel,
  isActive,
  style,
  barCount = 5,
  barColor = theme.colors.primary,
  testID,
}: SoundWaveProps) {
  // Create animated values for each bar
  const animatedValues = useRef(Array.from({ length: barCount }, () => new Animated.Value(0.2))).current

  // Silence threshold - below this level, no animation occurs
  const SILENCE_THRESHOLD = 0.05

  // Minimum height for bars (20% of container)
  const MIN_HEIGHT = 0.2

  useEffect(() => {
    if (isActive) {
      // Only animate if audio level is above silence threshold
      const isAudioDetected = audioLevel > SILENCE_THRESHOLD

      if (isAudioDetected) {
        // Animate bars based on real audio level with proportional scaling
        const animations = animatedValues.map((animatedValue, index) => {
          // Create variation in bar heights for more realistic effect
          // Each bar gets a slightly different response to create wave-like motion
          const variation = 0.8 + Math.sin(index * 0.5) * 0.2 // Sine wave variation between 0.6 and 1.0
          const scaledLevel = audioLevel * variation

          // Scale the target height proportionally with audio level
          // Ensure minimum height and scale up based on actual volume
          const targetHeight = Math.max(MIN_HEIGHT, MIN_HEIGHT + scaledLevel * 0.8)

          return Animated.timing(animatedValue, {
            toValue: targetHeight,
            duration: 80, // Faster response for real-time feel
            easing: Easing.out(Easing.quad), // Smooth easing for natural motion
            useNativeDriver: false, // Height animations can't use native driver
          })
        })

        // Start all animations in parallel
        Animated.parallel(animations).start()
      } else {
        // Audio level below threshold - animate to minimum height (silence state)
        const silenceAnimations = animatedValues.map(animatedValue =>
          Animated.timing(animatedValue, {
            toValue: MIN_HEIGHT,
            duration: 60, // Faster transition to silence for immediate visual feedback
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          })
        )

        Animated.parallel(silenceAnimations).start()
      }
    } else {
      // Reset all bars to minimum height when not active
      const resetAnimations = animatedValues.map(animatedValue =>
        Animated.timing(animatedValue, {
          toValue: MIN_HEIGHT,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        })
      )

      Animated.parallel(resetAnimations).start()
    }
  }, [audioLevel, isActive, animatedValues])

  return (
    <View style={[styles.container, style]} testID={testID}>
      {animatedValues.map((animatedValue, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              backgroundColor: barColor,
              height: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['20%', '100%'],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    paddingHorizontal: theme.spacing.md,
  },
  bar: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
    minHeight: '20%',
  },
})
