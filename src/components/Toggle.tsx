import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { theme } from '../utils/theme'

export type ToggleProps = {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  testID?: string
}

/**
 * Toggle/Switch component for settings
 * Provides a native-like toggle experience with smooth animations
 */
export const Toggle = React.memo(function Toggle({
  value,
  onValueChange,
  disabled = false,
  label,
  description,
  testID,
}: ToggleProps) {
  const animatedValue = React.useRef(new Animated.Value(value ? 1 : 0)).current

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }, [value, animatedValue])

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value)
    }
  }

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surface.tertiary, theme.colors.primary],
  })

  const thumbTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  })

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.text.secondary, '#FFFFFF'],
  })

  return (
    <View style={styles.container}>
      {(label || description) && (
        <View style={styles.textContainer}>
          {label && (
            <Text style={[styles.label, disabled && styles.disabledText]}>
              {label}
            </Text>
          )}
          {description && (
            <Text style={[styles.description, disabled && styles.disabledText]}>
              {description}
            </Text>
          )}
        </View>
      )}
      
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={[styles.touchable, disabled && styles.disabledTouchable]}
        activeOpacity={0.7}
        testID={testID}
      >
        <Animated.View
          style={[
            styles.track,
            { backgroundColor: trackColor },
            disabled && styles.disabledTrack,
          ]}
        >
          <Animated.View
            style={[
              styles.thumb,
              {
                transform: [{ translateX: thumbTranslateX }],
                backgroundColor: thumbColor,
              },
              disabled && styles.disabledThumb,
            ]}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },

  textContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },

  label: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },

  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },

  touchable: {
    padding: theme.spacing.xs,
  },

  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },

  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  disabledText: {
    color: theme.colors.text.disabled,
  },

  disabledTouchable: {
    opacity: 0.5,
  },

  disabledTrack: {
    opacity: 0.5,
  },

  disabledThumb: {
    opacity: 0.5,
  },
})
