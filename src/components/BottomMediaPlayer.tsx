import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ViewStyle, Text } from 'react-native'

import { MediaCard } from './Card'
import { AudioProgressBar } from './AudioProgressBar'
import { theme } from '@utils/theme'
import { formatPlaybackTime } from '@utils/timeFormat'

export type BottomMediaPlayerProps = {
  title?: string
  artist?: string
  currentTime?: number // Changed to number for progress bar
  duration?: number // Changed to number for progress bar
  isPlaying?: boolean
  isVisible?: boolean
  onPlayPause?: () => void
  onNext?: () => void
  onPrevious?: () => void
  onMore?: () => void
  onSeek?: (position: number) => void // Added for progress bar
  style?: ViewStyle
}

/**
 * Bottom Media Player Component
 * Fixed media player that appears at the bottom of the screen when audio is loaded
 * Now includes an audio progress bar with seeking functionality
 */
export function BottomMediaPlayer({
  title = '',
  artist = '',
  currentTime = 0,
  duration = 0,
  isPlaying = false,
  isVisible = false,
  onPlayPause,
  onNext,
  onPrevious,
  onMore,
  onSeek,
  style,
}: BottomMediaPlayerProps) {
  // State for tracking scrubber drag
  const [isDragging, setIsDragging] = useState(false)
  const [previewTime, setPreviewTime] = useState<number | undefined>(undefined)

  if (!isVisible) {
    return null
  }

  // Handle drag state changes from AudioProgressBar
  const handleDragStateChange = useCallback((dragging: boolean, preview?: number) => {
    setIsDragging(dragging)
    setPreviewTime(preview)
    console.log('🎵 BottomMediaPlayer: Drag state changed -', {
      isDragging: dragging,
      previewTime: preview
    })
  }, [])

  // Use preview time during dragging, otherwise use actual current time
  const displayCurrentTime = isDragging && previewTime !== undefined ? previewTime : currentTime

  // Format time for display
  const timeDisplay = formatPlaybackTime(displayCurrentTime, duration)

  // Debug logging for props
  console.log('🎵 BottomMediaPlayer: Received props -', {
    title,
    currentTime,
    duration,
    isPlaying,
    hasOnSeek: !!onSeek,
    isDragging,
    previewTime,
    displayCurrentTime
  })

  return (
    <View style={[styles.container, style]}>
      <View style={styles.playerContainer}>
        {/* Media Card with controls */}
        <MediaCard
          title={title}
          artist={artist}
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onNext={onNext}
          onPrevious={onPrevious}
          onMore={onMore}
          style={styles.mediaCard}
        />

        {/* Progress Bar */}
        {onSeek && (
          <AudioProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
            onDragStateChange={handleDragStateChange}
            style={styles.progressBar}
          />
        )}

        {/* Time Labels */}
        {timeDisplay.isValid && (
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{timeDisplay.current}</Text>
            <Text style={styles.timeText}>{timeDisplay.total}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    opacity: 0.97,
  },
  playerContainer: {
    backgroundColor: theme.colors.background.secondary, // Match tab bar background for seamless integration
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
    paddingTop: theme.spacing.sm,
  },
  mediaCard: {
    borderRadius: 0, // Remove border radius for seamless integration
    marginBottom: 0, // Remove bottom margin
    backgroundColor: 'transparent', // Make transparent since parent has background
    padding: theme.spacing.md,
  },
  progressBar: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  timeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.medium,
  },
})
