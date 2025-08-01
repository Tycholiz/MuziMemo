import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'

import { MediaCard } from './Card'
import { AudioProgressBar } from './AudioProgressBar'
import { theme } from '@utils/theme'

export type BottomMediaPlayerProps = {
  title?: string
  artist?: string
  duration?: string
  currentTime?: string
  isPlaying?: boolean
  isVisible?: boolean
  onPlayPause?: () => void
  onNext?: () => void
  onPrevious?: () => void
  onMore?: () => void
  onSeek?: (position: number) => void
  position?: number
  durationSeconds?: number
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
  currentTime = '',
  isPlaying = false,
  isVisible = false,
  onPlayPause,
  onNext,
  onPrevious,
  onMore,
  onSeek,
  position = 0,
  durationSeconds = 0,
  style,
}: BottomMediaPlayerProps) {
  if (!isVisible) {
    return null
  }

  // Format the artist display to include current time and duration
  const formatArtistDisplay = () => {
    const parts = []
    if (artist) parts.push(artist)
    if (currentTime && duration) {
      parts.push(`${currentTime} / ${duration}`)
    } else if (duration) {
      parts.push(duration)
    }
    return parts.join(' • ')
  }

  return (
    <View style={[styles.container, style]}>
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

      {/* Spotify-style progress bar */}
      {onSeek && durationSeconds > 0 && (
        <AudioProgressBar
          position={position}
          duration={durationSeconds}
          onSeek={onSeek}
          style={styles.progressBar}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    opacity: 0.97,
  },
  mediaCard: {
    borderRadius: 0, // Remove border radius for seamless integration
    marginBottom: 0, // Remove bottom margin
    backgroundColor: theme.colors.background.secondary, // Match tab bar background for seamless integration
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
  },
  progressBar: {
    backgroundColor: theme.colors.background.secondary,
    paddingTop: 0,
    paddingBottom: theme.spacing.xs,
  },
})
