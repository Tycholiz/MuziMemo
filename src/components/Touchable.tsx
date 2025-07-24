import React, { ReactNode } from 'react'
import {
  TouchableOpacity,
  TouchableHighlight,
  Pressable,
  StyleSheet,
  ViewStyle,
  GestureResponderEvent,
  Platform,
} from 'react-native'

import { theme } from '@utils/theme'

export type TouchableVariant = 'opacity' | 'highlight' | 'pressable'

export type TouchableProps = {
  children: ReactNode
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
  onPressIn?: (event: GestureResponderEvent) => void
  onPressOut?: (event: GestureResponderEvent) => void
  disabled?: boolean
  style?: ViewStyle
  variant?: TouchableVariant
  activeOpacity?: number
  underlayColor?: string
  rippleColor?: string
  borderless?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: string
  testID?: string
}

/**
 * Enhanced Touchable component with proper feedback and accessibility
 * Provides consistent touch interactions across the app
 */
export function Touchable({
  children,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled = false,
  style,
  variant = 'opacity',
  activeOpacity = 0.7,
  underlayColor = theme.colors.surface.secondary,
  rippleColor = theme.colors.surface.tertiary,
  borderless = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  testID,
}: TouchableProps) {
  const touchableStyle = [style, disabled && styles.disabled]

  const commonProps = {
    onPress,
    onLongPress,
    onPressIn,
    onPressOut,
    disabled,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole,
    testID,
  }

  switch (variant) {
    case 'highlight':
      return (
        <TouchableHighlight
          {...commonProps}
          style={touchableStyle}
          activeOpacity={activeOpacity}
          underlayColor={underlayColor}
        >
          {children}
        </TouchableHighlight>
      )

    case 'pressable':
      return (
        <Pressable
          {...commonProps}
          style={({ pressed }) => [
            touchableStyle,
            pressed && { opacity: activeOpacity },
          ]}
          android_ripple={{
            color: rippleColor,
            borderless,
          }}
        >
          {children}
        </Pressable>
      )

    case 'opacity':
    default:
      return (
        <TouchableOpacity
          {...commonProps}
          style={touchableStyle}
          activeOpacity={activeOpacity}
        >
          {children}
        </TouchableOpacity>
      )
  }
}

/**
 * Specialized touchable for list items with proper feedback
 */
export function TouchableListItem({
  children,
  onPress,
  onLongPress,
  disabled = false,
  style,
  showDivider = false,
  ...props
}: TouchableProps & {
  showDivider?: boolean
}) {
  return (
    <Touchable
      variant={Platform.OS === 'android' ? 'pressable' : 'highlight'}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={[styles.listItem, showDivider && styles.listItemWithDivider, style]}
      underlayColor={theme.colors.surface.secondary}
      rippleColor={theme.colors.surface.tertiary}
      {...props}
    >
      {children}
    </Touchable>
  )
}

/**
 * Touchable card component with elevation and proper feedback
 */
export function TouchableCard({
  children,
  onPress,
  disabled = false,
  style,
  elevated = true,
  ...props
}: TouchableProps & {
  elevated?: boolean
}) {
  return (
    <Touchable
      variant="opacity"
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.card,
        elevated && styles.cardElevated,
        style,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      {children}
    </Touchable>
  )
}

/**
 * Floating Action Button with proper touch feedback
 */
export function TouchableFAB({
  children,
  onPress,
  disabled = false,
  style,
  size = 'medium',
  ...props
}: TouchableProps & {
  size?: 'small' | 'medium' | 'large'
}) {
  const fabStyles = [
    styles.fab,
    styles[`fab${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
    style,
  ]

  return (
    <Touchable
      variant={Platform.OS === 'android' ? 'pressable' : 'opacity'}
      onPress={onPress}
      disabled={disabled}
      style={fabStyles}
      rippleColor={theme.colors.primaryLight}
      borderless={true}
      {...props}
    >
      {children}
    </Touchable>
  )
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  
  listItem: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
  },
  
  listItemWithDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.light,
  },
  
  card: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  
  cardElevated: {
    ...theme.shadows.md,
  },
  
  fab: {
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  
  fabSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  
  fabMedium: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  
  fabLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
})
