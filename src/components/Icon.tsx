import React from 'react'
import { View, StyleSheet, ViewStyle, TouchableOpacity, TextStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type IconColor = 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'error' | 'success' | 'warning' | 'white'

export type IconProps = {
  name: keyof typeof Ionicons.glyphMap
  size?: IconSize | number
  color?: IconColor | string
  style?: TextStyle
  onPress?: () => void
  disabled?: boolean
  containerStyle?: ViewStyle
}

export type IconButtonProps = {
  name: keyof typeof Ionicons.glyphMap
  size?: IconSize | number
  color?: IconColor | string
  style?: ViewStyle
  onPress?: () => void
  disabled?: boolean
  backgroundColor?: string
  variant?: 'default' | 'filled' | 'outlined' | 'ghost'
}

/**
 * Consistent Icon component with predefined sizes and colors
 * Supports both touchable and non-touchable variants
 */
export function Icon({
  name,
  size = 'md',
  color = 'primary',
  style,
  onPress,
  disabled = false,
  containerStyle,
}: IconProps) {
  const iconSize = getIconSize(size)
  const iconColor = getIconColor(color)

  const iconElement = (
    <Ionicons name={name} size={iconSize} color={disabled ? theme.colors.text.disabled : iconColor} style={style} />
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[styles.touchableContainer, containerStyle]}
        activeOpacity={0.7}
      >
        {iconElement}
      </TouchableOpacity>
    )
  }

  return containerStyle ? <View style={containerStyle}>{iconElement}</View> : iconElement
}

/**
 * Icon button with background and proper touch feedback
 * Perfect for action buttons like record, play, etc.
 */
export function IconButton({
  name,
  size = 'md',
  color = 'primary',
  backgroundColor,
  variant = 'default',
  onPress,
  disabled = false,
  style,
}: IconButtonProps) {
  const iconSize = getIconSize(size)
  const iconColor = getIconColor(color)

  const buttonStyles = [
    styles.iconButton,
    styles[variant],
    backgroundColor && { backgroundColor },
    disabled && styles.disabled,
    style,
  ]

  return (
    <TouchableOpacity style={buttonStyles} onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <Ionicons name={name} size={iconSize} color={disabled ? theme.colors.text.disabled : iconColor} />
    </TouchableOpacity>
  )
}

/**
 * Large circular record button as seen in the mockup
 */
export function RecordButton({
  isRecording = false,
  onPress,
  disabled = false,
  style,
}: {
  isRecording?: boolean
  onPress?: () => void
  disabled?: boolean
  style?: ViewStyle
}) {
  return (
    <TouchableOpacity
      style={[styles.recordButton, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.recordButtonInner}>
        <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color={theme.colors.white} />
      </View>
    </TouchableOpacity>
  )
}

function getIconSize(size: IconSize | number): number {
  if (typeof size === 'number') return size

  const sizes: Record<IconSize, number> = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
  }

  return sizes[size]
}

function getIconColor(color: IconColor | string): string {
  if (typeof color === 'string' && color.startsWith('#')) return color

  const colors: Record<IconColor, string> = {
    primary: theme.colors.text.primary,
    secondary: theme.colors.text.secondary,
    tertiary: theme.colors.text.tertiary,
    disabled: theme.colors.text.disabled,
    error: theme.colors.error,
    success: theme.colors.success,
    warning: theme.colors.warning,
    white: theme.colors.white,
  }

  return colors[color as IconColor] || theme.colors.text.primary
}

const styles = StyleSheet.create({
  touchableContainer: {
    padding: theme.spacing.xs,
  },

  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    minWidth: 44,
    minHeight: 44,
  },

  // Icon button variants
  default: {
    backgroundColor: 'transparent',
  },

  filled: {
    backgroundColor: theme.colors.primary,
  },

  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  ghost: {
    backgroundColor: 'transparent',
  },

  disabled: {
    opacity: 0.5,
  },

  // Record button styles
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },

  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
