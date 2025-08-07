import React from 'react'
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'

export type CardVariant = 'default' | 'elevated' | 'outlined'

export type CardProps = {
  children?: React.ReactNode
  variant?: CardVariant
  onPress?: () => void
  style?: ViewStyle
  disabled?: boolean
}

export type FileCardProps = {
  title: string
  subtitle?: string
  itemCount?: number
  icon?: keyof typeof Ionicons.glyphMap
  onPress?: () => void
  style?: ViewStyle
  disabled?: boolean
}

/**
 * Base Card component for containers and surfaces
 */
export function Card({ children, variant = 'default', onPress, style, disabled = false }: CardProps) {
  const cardStyles = [styles.base, styles[variant], disabled && styles.disabled, style]

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyles} onPress={onPress} disabled={disabled} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    )
  }

  return <View style={cardStyles}>{children}</View>
}

/**
 * Specialized Card component for file items as seen in the Quick Access section
 * Matches the design from the mockup with folder icon, title, and item count
 */
export function FileCard({
  title,
  subtitle,
  itemCount,
  icon = 'folder-outline',
  onPress,
  style,
  disabled = false,
}: FileCardProps) {
  const cardStyles = [styles.base, styles.default, disabled && styles.disabled, style]

  return (
    <TouchableOpacity style={cardStyles} onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <View style={styles.fileCardContent}>
        <View style={styles.fileCardIcon}>
          <Ionicons name={icon} size={24} color={theme.colors.text.secondary} />
        </View>

        <View style={styles.fileCardText}>
          <Text style={styles.fileCardTitle}>{title}</Text>
          {subtitle && <Text style={styles.fileCardSubtitle}>{subtitle}</Text>}
          {itemCount !== undefined && (
            <Text style={styles.fileCardCount}>
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

/**
 * Card component for media player controls (as seen at bottom of mockup)
 */
export function MediaCard({
  title,
  artist,
  duration,
  onPlayPause,
  onSkipForward,
  onSkipBackward,
  isPlaying = false,
  style,
}: {
  title: string
  artist?: string
  duration?: string
  onPlayPause?: () => void
  onSkipForward?: () => void
  onSkipBackward?: () => void
  isPlaying?: boolean
  style?: ViewStyle
}) {
  return (
    <View style={[styles.base, styles.elevated, styles.mediaCard, style]}>
      <View style={styles.mediaCardContent}>
        <View style={styles.mediaCardInfo}>
          <Text style={styles.mediaCardTitle} numberOfLines={1}>
            {title}
          </Text>
          {artist && (
            <Text style={styles.mediaCardArtist} numberOfLines={1}>
              {artist} {duration && `• ${duration}`}
            </Text>
          )}
        </View>

        <View style={styles.mediaCardControls}>
          <TouchableOpacity onPress={onSkipBackward} style={styles.mediaControlButton}>
            <Ionicons name="play-back" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={onPlayPause} style={styles.mediaControlButton}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={onSkipForward} style={styles.mediaControlButton}>
            <Ionicons name="play-forward" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },

  // Variants
  default: {
    backgroundColor: theme.colors.surface.primary,
  },

  elevated: {
    backgroundColor: theme.colors.surface.primary,
    ...theme.shadows.md,
  },

  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  disabled: {
    opacity: 0.5,
  },

  // File Card styles
  fileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  fileCardIcon: {
    marginRight: theme.spacing.md,
  },

  fileCardText: {
    flex: 1,
  },

  fileCardTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },

  fileCardSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs / 2,
  },

  fileCardCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },

  // Media Card styles
  mediaCard: {
    marginBottom: 0,
  },

  mediaCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  mediaCardInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },

  mediaCardTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },

  mediaCardArtist: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },

  mediaCardControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  mediaControlButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
})
