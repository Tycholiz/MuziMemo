import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
export type ButtonSize = 'small' | 'medium' | 'large'

export type ButtonProps = {
  title?: string
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  icon?: keyof typeof Ionicons.glyphMap
  iconPosition?: 'left' | 'right'
  onPress?: () => void
  style?: ViewStyle
  textStyle?: TextStyle
  fullWidth?: boolean
}

/**
 * Base Button component with multiple variants and sizes
 * Supports icons, loading states, and follows the dark theme design
 */
export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onPress,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ]

  const textStyles = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles],
    styles[`${size}Text` as keyof typeof styles],
    disabled && styles.disabledText,
    textStyle,
  ]

  const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24
  const iconColor = getIconColor(variant, disabled)

  const renderIcon = (position: 'left' | 'right') => {
    if (!icon || iconPosition !== position) return null
    
    return (
      <Ionicons
        name={icon}
        size={iconSize}
        color={iconColor}
        style={position === 'left' ? styles.iconLeft : styles.iconRight}
      />
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'small'}
          color={getIconColor(variant, disabled)}
        />
      )
    }

    return (
      <>
        {renderIcon('left')}
        {title && <Text style={textStyles}>{title}</Text>}
        {renderIcon('right')}
      </>
    )
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  )
}

function getIconColor(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) return theme.colors.text.disabled

  switch (variant) {
    case 'primary':
    case 'danger':
      return theme.colors.white
    case 'secondary':
      return theme.colors.text.primary
    case 'ghost':
    case 'outline':
      return theme.colors.primary
    default:
      return theme.colors.text.primary
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
  },
  
  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  secondary: {
    backgroundColor: theme.colors.surface.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  danger: {
    backgroundColor: theme.colors.error,
    ...theme.shadows.sm,
  },
  
  // Sizes
  small: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 52,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  
  // Text styles
  text: {
    fontWeight: theme.typography.fontWeight.semiBold,
    textAlign: 'center',
  },
  primaryText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
  },
  secondaryText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
  },
  ghostText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.base,
  },
  outlineText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.base,
  },
  dangerText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
  },
  disabledText: {
    color: theme.colors.text.disabled,
  },
  
  // Size-specific text
  smallText: {
    fontSize: theme.typography.fontSize.sm,
  },
  mediumText: {
    fontSize: theme.typography.fontSize.base,
  },
  largeText: {
    fontSize: theme.typography.fontSize.lg,
  },
  
  // Icon styles
  iconLeft: {
    marginRight: theme.spacing.xs,
  },
  iconRight: {
    marginLeft: theme.spacing.xs,
  },
})
