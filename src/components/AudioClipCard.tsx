import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '../utils/theme'
import { FileContextMenuModal } from './FileContextMenuModal'
import { formatDateSmart, formatFileSize } from '../utils/formatUtils'

export type AudioClipData = {
  id: string
  name: string
  uri: string
  size: number
  createdAt: Date
  duration?: number
}

export type AudioClipCardProps = {
  clip: AudioClipData
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onRename?: () => void
  onMove?: () => void
  onRestore?: () => void
  onDelete?: () => void
  isInRecentlyDeleted?: boolean
}

export const AudioClipCard = React.memo(function AudioClipCard({
  clip,
  isPlaying,
  onPlay,
  onPause,
  onRename,
  onMove,
  onRestore,
  onDelete,
  isInRecentlyDeleted = false,
}: AudioClipCardProps) {
  const handlePress = () => {
    console.log('🎵 AudioClipCard: handlePress called for:', clip.name)
    console.log('🎵 AudioClipCard: isPlaying:', isPlaying)
    if (isPlaying) {
      console.log('🎵 AudioClipCard: Calling onPause')
      onPause()
    } else {
      console.log('🎵 AudioClipCard: Calling onPlay')
      onPlay()
    }
  }

  return (
    <View style={[styles.container, isPlaying && styles.containerPlaying]}>
      <TouchableOpacity style={styles.content} onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.playButton}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color={isPlaying ? theme.colors.primary : theme.colors.text.primary}
          />
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, isPlaying && styles.namePlaying]} numberOfLines={1}>
            {clip.name}
          </Text>
          <Text style={styles.details}>
            {formatDateSmart(clip.createdAt)} • {formatFileSize(clip.size)}
            {clip.duration && ` • ${clip.duration}`}
          </Text>
        </View>

        {isPlaying && (
          <View style={styles.playingIndicator}>
            <Ionicons name="volume-high" size={16} color={theme.colors.primary} />
          </View>
        )}
      </TouchableOpacity>

      {(onRename || onMove || onRestore || onDelete) && (
        <View style={styles.menuContainer}>
          <FileContextMenuModal
            onRename={onRename || (() => {})}
            onMove={onMove}
            onRestore={onRestore}
            onDelete={onDelete || (() => {})}
            isInRecentlyDeleted={isInRecentlyDeleted}
          />
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  containerPlaying: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface.primary,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  namePlaying: {
    color: theme.colors.primary,
  },
  details: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
  },
  playingIndicator: {
    marginLeft: 8,
  },
  menuContainer: {
    paddingRight: 8,
  },
})
