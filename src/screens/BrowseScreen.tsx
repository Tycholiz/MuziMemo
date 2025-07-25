import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '@components/Layout'
import {
  FolderContextMenuModal,
  FileContextMenuModal,
  Breadcrumbs,
  BottomMediaPlayer,
  useFileSystemManager,
  type FolderCardData,
  type ClipData,
} from '@components/index'
import { useAudioPlayerHook } from '@hooks/useAudioPlayer'
import { theme } from '@utils/theme'
import { getRecordingsDirectory, joinPath, generateBreadcrumbs } from '@utils/pathUtils'
import * as FileSystem from 'expo-file-system'

// Utility function to format time in MM:SS format
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * BrowseScreen Component (Refactored)
 * Main screen for browsing and managing recorded audio files
 * Uses FileSystemManager for all file operations
 */
export default function BrowseScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPath, setCurrentPath] = useState<string[]>([]) // Empty array means root
  const [selectedClip, setSelectedClip] = useState<ClipData | null>(null)

  // Use FileSystemManager hook
  const { folders, clips, loading, handlers, FileSystemManagerComponent } = useFileSystemManager(currentPath)

  // Use Audio Player hook
  const audioPlayer = useAudioPlayerHook()

  const getCurrentFolderPath = (): string => {
    if (currentPath.length === 0) {
      return getRecordingsDirectory()
    }
    return joinPath(getRecordingsDirectory(), ...currentPath)
  }

  const handleFolderPress = (folder: FolderCardData) => {
    // Stop current playback when navigating to a different folder
    audioPlayer.cleanup()
    setSelectedClip(null)

    // Navigate into the folder
    setCurrentPath([...currentPath, folder.name])
  }

  const handleClipPress = async (clip: ClipData) => {
    try {
      console.log('=== BROWSE SCREEN CLIP PRESS ===')
      console.log('Clip pressed:', clip.name)
      console.log('Clip path:', clip.path)
      console.log('Clip data:', JSON.stringify(clip, null, 2))

      // Debug: Check if file actually exists
      const fileInfo = await FileSystem.getInfoAsync(clip.path)
      console.log('File exists at path:', fileInfo.exists)
      console.log('File info:', JSON.stringify(fileInfo, null, 2))

      // Debug: List all files in current directory
      const currentDir = getCurrentFolderPath()
      console.log('Current directory:', currentDir)
      try {
        const dirContents = await FileSystem.readDirectoryAsync(currentDir)
        console.log('Directory contents:', dirContents)
      } catch (dirError) {
        console.log('Could not read directory:', dirError)
      }

      // If the same clip is already selected, toggle play/pause
      if (selectedClip?.id === clip.id) {
        console.log('Same clip selected, toggling play/pause')
        await audioPlayer.togglePlayPause()
        return
      }

      // Set the new selected clip
      setSelectedClip(clip)

      // Load and play the new audio file
      console.log('Loading new audio file:', clip.path)
      await audioPlayer.loadAudio(clip.path)
      await audioPlayer.play()
    } catch (error) {
      console.error('Failed to play clip:', error)
      Alert.alert('Playback Error', 'Failed to play the selected audio file')
    }
  }

  const handleHomePress = () => {
    // Stop current playback when navigating to root
    audioPlayer.cleanup()
    setSelectedClip(null)

    // Navigate to root
    setCurrentPath([])
  }

  const handleBreadcrumbPress = (_path: string, index: number) => {
    // Stop current playback when navigating via breadcrumbs
    audioPlayer.cleanup()
    setSelectedClip(null)

    // Navigate to specific level in breadcrumb
    if (index === 0) {
      setCurrentPath([])
    } else {
      setCurrentPath(currentPath.slice(0, index))
    }
  }

  // Media player control handlers
  const handleNext = () => {
    const currentIndex = clips.findIndex(clip => clip.id === selectedClip?.id)
    if (currentIndex >= 0 && currentIndex < clips.length - 1) {
      const nextClip = clips[currentIndex + 1]
      handleClipPress(nextClip)
    }
  }

  const handlePrevious = () => {
    const currentIndex = clips.findIndex(clip => clip.id === selectedClip?.id)
    if (currentIndex > 0) {
      const previousClip = clips[currentIndex - 1]
      handleClipPress(previousClip)
    }
  }

  const handleMore = () => {
    Alert.alert('More Options', 'Additional playback options coming soon!')
  }

  const renderFolderCard = (folder: FolderCardData) => (
    <View key={folder.id} style={styles.folderCard}>
      <TouchableOpacity style={styles.folderContent} onPress={() => handleFolderPress(folder)} activeOpacity={0.7}>
        <View style={styles.folderIcon}>
          <Ionicons name="folder" size={32} color={theme.colors.primary} />
        </View>
        <Text style={styles.folderName}>{folder.name}</Text>
        <Text style={styles.folderItemCount}>{folder.itemCount} items</Text>
      </TouchableOpacity>

      <View style={styles.folderMenuContainer}>
        <FolderContextMenuModal
          onRename={() => handlers?.folderHandlers.onRename(folder)}
          onMove={() => handlers?.folderHandlers.onMove(folder)}
          onDelete={() => handlers?.folderHandlers.onDelete(folder)}
        />
      </View>
    </View>
  )

  const renderClipItem = (clip: ClipData) => {
    const isSelected = selectedClip?.id === clip.id
    const isPlaying = isSelected && audioPlayer.status === 'playing'

    return (
      <TouchableOpacity
        key={clip.id}
        style={[styles.clipItem, isSelected && styles.clipItemSelected]}
        onPress={() => handleClipPress(clip)}
        activeOpacity={0.7}
      >
        <View style={styles.clipInfo}>
          <View style={styles.clipNameContainer}>
            <Text style={[styles.clipName, isSelected && styles.clipNameSelected]}>{clip.name}</Text>
            {isPlaying && (
              <Ionicons name="volume-high" size={16} color={theme.colors.primary} style={styles.playingIcon} />
            )}
          </View>
          <Text style={styles.clipDetails}>
            {clip.date} • {clip.duration}
          </Text>
        </View>
        <FileContextMenuModal
          onRename={() => handlers?.fileHandlers.onRename(clip)}
          onMove={() => handlers?.fileHandlers.onMove(clip)}
          onDelete={() => handlers?.fileHandlers.onDelete(clip)}
        />
      </TouchableOpacity>
    )
  }

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Browse</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons name={viewMode === 'grid' ? 'list' : 'grid'} size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={theme.colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clips, folders..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Breadcrumb */}
        <Breadcrumbs
          breadcrumbs={generateBreadcrumbs(getCurrentFolderPath())}
          onBreadcrumbPress={handleBreadcrumbPress}
          onHomePress={handleHomePress}
          variant="default"
        />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* New Folder Button */}
          <View style={styles.newFolderContainer}>
            <TouchableOpacity
              style={styles.newFolderButton}
              onPress={() => handlers?.folderHandlers.onNew()}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={theme.colors.surface.primary} />
              <Text style={styles.newFolderText}>New Folder</Text>
            </TouchableOpacity>
          </View>

          {/* Folders Section - show when there are folders */}
          {folders.length > 0 && (
            <View style={styles.foldersContainer}>
              <View style={styles.foldersGrid}>{folders.map(renderFolderCard)}</View>
            </View>
          )}

          {/* Clips Section - show when there are clips */}
          {clips.length > 0 && (
            <View style={styles.clipsSection}>
              <Text style={styles.clipsTitle}>{clips.length} clips</Text>
              <View style={styles.clipsList}>{clips.map(renderClipItem)}</View>
            </View>
          )}

          {/* Empty state when folder has no content */}
          {folders.length === 0 && clips.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {currentPath.length === 0 ? 'No folders or clips yet' : 'This folder is empty'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Bottom Media Player - Fixed at bottom, full width */}
      <BottomMediaPlayer
        title={selectedClip?.name || ''}
        artist={selectedClip?.folder || ''}
        duration={selectedClip?.duration || ''}
        currentTime={formatTime(audioPlayer.currentTime)}
        isPlaying={audioPlayer.status === 'playing'}
        isVisible={!!selectedClip}
        onPlayPause={audioPlayer.togglePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onMore={handleMore}
        style={styles.mediaPlayerContainer}
      />

      {/* FileSystemManager handles all dialogs and operations */}
      {FileSystemManagerComponent}
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  } as ViewStyle,
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  } as TextStyle,
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  } as ViewStyle,
  viewToggle: {
    padding: theme.spacing.xs,
  } as ViewStyle,
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  } as ViewStyle,
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  } as ViewStyle,
  searchIcon: {
    marginRight: theme.spacing.sm,
  } as TextStyle,
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  } as TextStyle,
  newFolderContainer: {
    marginBottom: theme.spacing.lg,
  } as ViewStyle,
  newFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  } as ViewStyle,
  newFolderText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.surface.primary,
  } as TextStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,
  foldersContainer: {
    marginBottom: theme.spacing.lg,
  } as ViewStyle,
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  } as ViewStyle,
  folderCard: {
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    width: '47%',
    position: 'relative',
  } as ViewStyle,
  folderContent: {
    alignItems: 'center',
  } as ViewStyle,
  folderIcon: {
    marginBottom: theme.spacing.sm,
  } as ViewStyle,
  folderName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  } as TextStyle,
  folderItemCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  } as TextStyle,
  folderMenuContainer: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  } as ViewStyle,
  clipsSection: {
    flex: 1,
    marginBottom: theme.spacing.md,
  } as ViewStyle,
  clipsTitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.md,
  } as TextStyle,
  clipsList: {
    gap: theme.spacing.sm,
  } as ViewStyle,
  clipItem: {
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  clipInfo: {
    flex: 1,
  } as ViewStyle,
  clipNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  } as ViewStyle,
  clipName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    flex: 1,
  } as TextStyle,
  clipNameSelected: {
    color: theme.colors.primary,
  } as TextStyle,
  playingIcon: {
    marginLeft: theme.spacing.xs,
  } as TextStyle,
  clipDetails: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  } as TextStyle,
  clipItemSelected: {
    backgroundColor: theme.colors.surface.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  } as ViewStyle,
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  } as ViewStyle,
  emptyStateText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  } as TextStyle,
  mediaPlayerContainer: {
    paddingHorizontal: 0,
    paddingBottom: theme.spacing.lg,
  } as ViewStyle,
})
