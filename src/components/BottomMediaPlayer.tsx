import React from 'react'
import { View, StyleSheet, ViewStyle, Text } from 'react-native'

import { MediaCard } from './Card'
import { AudioProgressBar } from './AudioProgressBar'
import { theme } from '@utils/theme'
import { formatDurationSmart } from '@utils/formatUtils'

export type BottomMediaPlayerProps = {
  title?: string
  artist?: string
  duration?: string
  currentTime?: string
  /** Current playback position in seconds (for progress bar) */
  currentTimeSeconds?: number
  /** Total duration in seconds (for progress bar) */
  durationSeconds?: number
  /** Callback when user seeks to a new position */
  onSeek?: (seconds: number) => void
  isPlaying?: boolean
  isVisible?: boolean
  onPlayPause?: () => void
  onNext?: () => void
  onPrevious?: () => void
  onMore?: () => void
  style?: ViewStyle
}

/**
 * Bottom Media Player Component
 * Fixed media player that appears at the bottom of the screen when audio is loaded
 */
export function BottomMediaPlayer({
  title = '',
  artist = '',
  duration = '',
  currentTimeSeconds = 0,
  durationSeconds = 0,
  onSeek,
  isPlaying = false,
  isVisible = false,
  onPlayPause,
  onNext,
  onPrevious,
  onMore,
  style,
}: BottomMediaPlayerProps) {
  if (!isVisible) {
    return null
  }

  // Format the artist display (no longer includes duration since it's shown separately)
  const formatArtistDisplay = () => {
    return artist || ''
  }

  // Format duration labels
  const currentTimeFormatted = formatDurationSmart(currentTimeSeconds)
  const durationFormatted = formatDurationSmart(durationSeconds)
  const showDurationLabels = durationSeconds > 0

  return (
    <View style={[styles.container, style]}>
      {/* Progress Bar */}
      {showDurationLabels && onSeek && (
        <View style={styles.progressContainer}>
          <AudioProgressBar
            currentTime={currentTimeSeconds}
            duration={durationSeconds}
            onSeek={onSeek}
            disabled={!isPlaying && currentTimeSeconds === 0}
          />
        </View>
      )}

      {/* Duration Labels */}
      {showDurationLabels && (
        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>{currentTimeFormatted}</Text>
          <Text style={styles.durationText}>{durationFormatted}</Text>
        </View>
      )}

      {/* Media Card */}
      <MediaCard
        title={title}
        artist={formatArtistDisplay()}
        duration={duration}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        onNext={onNext}
        onPrevious={onPrevious}
        onMore={onMore}
        style={styles.mediaCard}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    opacity: 0.97,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
    backgroundColor: theme.colors.background.secondary,
  },
  durationText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  mediaCard: {
    borderRadius: 0, // Remove border radius for seamless integration
    marginBottom: 0, // Remove bottom margin
    backgroundColor: theme.colors.background.secondary, // Match tab bar background for seamless integration
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
  },
})
