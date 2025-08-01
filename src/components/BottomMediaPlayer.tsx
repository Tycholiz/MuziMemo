import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'

import { MediaCard } from './Card'
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    opacity: 0.9,
  },
  mediaCard: {
    borderRadius: 0, // Remove border radius for seamless integration
    marginBottom: 0, // Remove bottom margin
    backgroundColor: theme.colors.tabBar.background, // Match tab bar background for seamless integration
  },
})
