import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'

import { MediaCard } from './Card'
import { AudioProgressBar } from './AudioProgressBar'
import { FileContextMenuModal } from './FileContextMenuModal'
import { theme } from '@utils/theme'

export type BottomMediaPlayerProps = {
  title?: string
  artist?: string
  duration?: string
  currentTime?: string
  currentTimeSeconds?: number
  durationSeconds?: number
  isPlaying?: boolean
  isVisible?: boolean
  onPlayPause?: () => void
  onSkipForward?: () => void
  onSkipBackward?: () => void
  onSeek?: (position: number) => void
  onRename?: () => void
  onMove?: () => void
  onDelete?: () => void
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
  currentTimeSeconds = 0,
  durationSeconds = 0,
  isPlaying = false,
  isVisible = false,
  onPlayPause,
  onSkipForward,
  onSkipBackward,
  onSeek,
  onRename,
  onMove,
  onDelete,
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
      <View style={[styles.mediaCard]}>
        <MediaCard
          title={title}
          artist={formatArtistDisplay()}
          duration={duration}
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onSkipForward={onSkipForward}
          onSkipBackward={onSkipBackward}
          onMore={undefined} // We'll handle the menu separately
          style={styles.mediaCardInner}
        />

        {/* File Context Menu */}
        {(onRename || onMove || onDelete) && (
          <View style={styles.menuContainer}>
            <FileContextMenuModal
              onRename={onRename || (() => {})}
              onMove={onMove}
              onDelete={onDelete || (() => {})}
              isInRecentlyDeleted={false} // Bottom player is never for recently deleted files
            />
          </View>
        )}
      </View>

      {/* Audio Progress Bar */}
      {onSeek && (
        <AudioProgressBar
          currentTime={currentTimeSeconds}
          duration={durationSeconds}
          onSeek={onSeek}
          disabled={false} // Always allow seeking, even when paused or completed
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaCardInner: {
    flex: 1,
    borderRadius: 0,
    backgroundColor: theme.colors.background.secondary,
  },
  menuContainer: {
    paddingRight: 8,
  },
  progressBar: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.md,
  },
})
