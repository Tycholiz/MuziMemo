import React, { useCallback, useRef, useState } from 'react'
import { StyleSheet, View, Animated, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '../components/Layout'
import { FileSystemComponent } from '../components/FileSystem'
import { SearchBar, SearchBarRef } from '../components/SearchBar'
import { SettingsModal } from '../components/SettingsModal'
import { theme } from '../utils/theme'
import { useAudioPlayerContext } from '../contexts/AudioPlayerContext'
import { useFileManager } from '../contexts/FileManagerContext'
import { getParentDirectoryPath } from '../utils/searchUtils'

/**
 * BrowseScreen Component
 * Main screen for browsing and managing recorded audio files
 * Uses FileManagerContext for state management
 * Media player is now handled at the tab layout level for persistence
 */
export default function BrowseScreen() {
  const audioPlayer = useAudioPlayerContext()
  const fileManager = useFileManager()
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // Animation for highlighting selected items
  const glowAnim = useRef(new Animated.Value(0)).current

  // Ref for SearchBar to control dropdown dismissal
  const searchBarRef = useRef<SearchBarRef>(null)

  const handleSearchResultSelect = useCallback(
    (type: 'audio' | 'folder', item: any) => {
      if (type === 'audio') {
        console.log('🗂️ Navigating to audio file directory:', item)
        // Navigate to the file's parent directory (no playback)
        const parentPath = getParentDirectoryPath(item.relativePath)
        if (parentPath.length > 0) {
          fileManager.navigateToPath(parentPath)
        } else {
          fileManager.navigateToRoot()
        }

        // Trigger glow animation
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ]).start()
      } else if (type === 'folder') {
        // Navigate to the selected folder
        const folderPath = item.relativePath.split('/').filter(Boolean)
        fileManager.navigateToPath(folderPath)
      }
    },
    [fileManager, glowAnim]
  )

  const handleAudioPlayPause = useCallback(
    (audioFile: any) => {
      console.log('🎵 Play/Pause audio from search results:', audioFile)

      // If this is the current clip and it's playing, pause it
      if (audioPlayer.currentClip?.id === audioFile.id && audioPlayer.isPlaying) {
        audioPlayer.pauseClip()
      } else {
        // Play the selected audio file
        audioPlayer.playClip({
          id: audioFile.id,
          name: audioFile.name,
          uri: audioFile.uri,
          duration: audioFile.duration,
        })
      }
    },
    [audioPlayer]
  )

  // Settings modal handlers
  const handleSettingsPress = useCallback(() => setShowSettingsModal(true), [])
  const handleSettingsClose = useCallback(() => setShowSettingsModal(false), [])

  return (
    <Screen padding={false}>
      <View style={styles.container}>
        {/* Header with Settings Button */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            ref={searchBarRef}
            onResultSelect={handleSearchResultSelect}
            onAudioPlayPause={handleAudioPlayPause}
            currentPath={fileManager.currentPath}
            currentPlayingId={audioPlayer.currentClip?.id}
            isPlaying={audioPlayer.isPlaying}
          />
        </View>

        {/* File System Component */}
        <View style={styles.fileSystemContainer}>
          <FileSystemComponent />
        </View>
      </View>

      {/* Settings Modal */}
      <SettingsModal visible={showSettingsModal} onClose={handleSettingsClose} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  settingsButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#1F2124', // theme.colors.surface.primary
  },
  fileSystemContainer: {
    flex: 1,
  },
})
