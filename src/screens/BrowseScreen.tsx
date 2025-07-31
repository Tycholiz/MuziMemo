import React, { useCallback, useRef } from 'react'
import { StyleSheet, View, Animated } from 'react-native'

import { Screen } from '../components/Layout'
import { FileSystemComponent } from '../components/FileSystem'
import { BottomMediaPlayer } from '../components/BottomMediaPlayer'
import { SearchBar } from '../components/SearchBar'
import { useAudioPlayerContext } from '../contexts/AudioPlayerContext'
import { useFileManager } from '../contexts/FileManagerContext'
import { getParentDirectoryPath } from '../utils/searchUtils'

/**
 * BrowseScreen Component
 * Main screen for browsing and managing recorded audio files
 * Uses FileManagerContext and AudioPlayerContext for state management
 */
export default function BrowseScreen() {
  const audioPlayer = useAudioPlayerContext()
  const fileManager = useFileManager()

  // Animation for highlighting selected items
  const glowAnim = useRef(new Animated.Value(0)).current

  const handleSearchResultSelect = useCallback(
    (type: 'audio' | 'folder', item: any) => {
      if (type === 'audio') {
        // Play the selected audio file
        audioPlayer.playClip({
          id: item.id,
          name: item.name,
          uri: item.uri,
          duration: item.duration,
        })

        // Navigate to the file's parent directory
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
    [audioPlayer, fileManager, glowAnim]
  )

  const handleNavigateToFolder = useCallback(
    (folderPath: string[]) => {
      if (folderPath.length > 0) {
        fileManager.navigateToPath(folderPath)
      } else {
        fileManager.navigateToRoot()
      }
    },
    [fileManager]
  )

  return (
    <Screen padding={false}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            onResultSelect={handleSearchResultSelect}
            onNavigateToFolder={handleNavigateToFolder}
          />
        </View>

        {/* File System Component */}
        <FileSystemComponent />

        {/* Show media player if audio is playing */}
        {audioPlayer.currentClip && (
          <BottomMediaPlayer
            title={audioPlayer.currentClip.name}
            isPlaying={audioPlayer.isPlaying}
            isVisible={true}
            onPlayPause={() => {
              if (audioPlayer.isPlaying) {
                audioPlayer.pauseClip()
              } else {
                audioPlayer.playClip(audioPlayer.currentClip!)
              }
            }}
          />
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#1F2124', // theme.colors.surface.primary
  },
})
