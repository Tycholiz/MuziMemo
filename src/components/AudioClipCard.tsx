import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { DraxView } from 'react-native-drax'

import { theme } from '../utils/theme'
import { FileContextMenuModal } from './FileContextMenuModal'
import { formatDateSmart, formatAudioDuration } from '../utils/formatUtils'

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
  onShare?: () => void
  onDelete?: () => void
  isInRecentlyDeleted?: boolean
  isMultiSelectMode?: boolean
  isSelected?: boolean
  onToggleSelection?: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

export const AudioClipCard = React.memo(function AudioClipCard({
  clip,
  isPlaying,
  onPlay,
  onPause,
  onRename,
  onMove,
  onRestore,
  onShare,
  onDelete,
  isInRecentlyDeleted = false,
  isMultiSelectMode = false,
  isSelected = false,
  onToggleSelection,
  onDragStart,
  onDragEnd,
}: AudioClipCardProps) {
  const handlePress = () => {
    if (isMultiSelectMode && onToggleSelection) {
      console.log('🎵 AudioClipCard: Multi-select mode - toggling selection for:', clip.name)
      onToggleSelection()
    } else {
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
  }

  const dragPayload = {
    id: clip.id,
    type: 'audioFile' as const,
    name: clip.name,
  }

  return (
    <DraxView
      style={[styles.container, isPlaying && styles.containerPlaying]}
      draggingStyle={styles.containerDragging}
      dragPayload={dragPayload}
      longPressDelay={500}
      onDragStart={() => {
        if (!isMultiSelectMode && onDragStart) {
          onDragStart()
        }
      }}
      onDragEnd={() => {
        if (onDragEnd) {
          onDragEnd()
        }
      }}
    >
      <TouchableOpacity style={styles.content} onPress={handlePress} activeOpacity={0.7} testID="audio-clip-card-content">
        <View style={[styles.playButton, isMultiSelectMode && isSelected && styles.playButtonSelected]}>
          <Ionicons
            name={isMultiSelectMode ? 'checkmark-circle' : (isPlaying ? 'pause' : 'play')}
            size={24}
            color={
              isMultiSelectMode
                ? (isSelected ? theme.colors.surface.primary : theme.colors.text.secondary)
                : (isPlaying ? theme.colors.primary : theme.colors.text.primary)
            }
          />
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, isPlaying && styles.namePlaying]} numberOfLines={1}>
            {clip.name}
          </Text>
          <Text style={styles.details}>
            {formatDateSmart(clip.createdAt)} • {formatAudioDuration(clip.duration)}
          </Text>
        </View>

        {isPlaying && (
          <View style={styles.playingIndicator}>
            <Ionicons name="volume-high" size={16} color={theme.colors.primary} />
          </View>
        )}
      </TouchableOpacity>

      {(onRename || onMove || onRestore || onShare || onDelete) && (
        <View style={styles.menuContainer}>
          <FileContextMenuModal
            onRename={onRename || (() => {})}
            onMove={onMove}
            onRestore={onRestore}
            onShare={onShare}
            onDelete={onDelete || (() => {})}
            isInRecentlyDeleted={isInRecentlyDeleted}
          />
        </View>
      )}
    </DraxView>
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
  containerDragging: {
    opacity: 0.7,
    transform: [{ scale: 1.05 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  playButtonSelected: {
    backgroundColor: theme.colors.primary,
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
