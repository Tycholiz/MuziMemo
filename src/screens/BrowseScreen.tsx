import React, { useCallback, useRef } from 'react'
import { StyleSheet, View, Animated } from 'react-native'

import { Screen } from '../components/Layout'
import { FileSystemComponent } from '../components/FileSystem'
import { BottomMediaPlayer } from '../components/BottomMediaPlayer'
import { SearchBar, SearchBarRef } from '../components/SearchBar'
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



  return (
    <Screen padding={false}>
      <View style={styles.container}>
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
  fileSystemContainer: {
    flex: 1,
  },
})
