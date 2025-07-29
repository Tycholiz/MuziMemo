import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, ViewStyle } from 'react-native'

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
 * When audioLevel is 0 (no sound), bars remain at minimum height (20%)
 * When audioLevel increases (louder sound), bars animate to higher heights
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

  useEffect(() => {
    if (isActive) {
      // Animate bars based on audio level
      const animations = animatedValues.map(animatedValue => {
        // Create variation in bar heights for more realistic effect
        const variation = Math.random() * 0.3 + 0.7 // Random between 0.7 and 1.0
        const targetHeight = Math.max(0.2, audioLevel * variation)

        return Animated.timing(animatedValue, {
          toValue: targetHeight,
          duration: 100,
          useNativeDriver: false,
        })
      })

      // Start all animations
      Animated.parallel(animations).start()
    } else {
      // Reset all bars to minimum height when not active
      const resetAnimations = animatedValues.map(animatedValue =>
        Animated.timing(animatedValue, {
          toValue: 0.2,
          duration: 200,
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
