import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'

import { MediaCard } from './Card'
import { AudioProgressBar } from './AudioProgressBar'
import { useAudioPlayerContext } from '../contexts/AudioPlayerContext'
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
  showProgressBar?: boolean
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
  showProgressBar = true,
}: BottomMediaPlayerProps) {
  const audioPlayer = useAudioPlayerContext()

  if (!isVisible) {
    return null
  }

  // Format the artist display to include current time and duration
  const formatArtistDisplay = () => {
    const parts = []
    if (artist) parts.push(artist)
    if (!showProgressBar && currentTime && duration) {
      parts.push(`${currentTime} / ${duration}`)
    } else if (!showProgressBar && duration) {
      parts.push(duration)
    }
    return parts.join(' • ')
  }

  return (
    <View style={[styles.container, style]}>
      {/* Progress Bar */}
      {showProgressBar && (
        <AudioProgressBar
          currentTime={audioPlayer.position}
          duration={audioPlayer.duration}
          onSeek={audioPlayer.seekTo}
          disabled={!audioPlayer.currentClip}
          style={styles.progressBar}
        />
      )}

      {/* Media Controls */}
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
  progressBar: {
    backgroundColor: theme.colors.background.secondary,
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
  },
  mediaCard: {
    borderRadius: 0, // Remove border radius for seamless integration
    marginBottom: 0, // Remove bottom margin
    backgroundColor: theme.colors.background.secondary, // Match tab bar background for seamless integration
    borderTopLeftRadius: 0, // Remove top radius since progress bar is above
    borderTopRightRadius: 0, // Remove top radius since progress bar is above
  },
})
