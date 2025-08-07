import React, { useCallback, useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system'

import { BottomMediaPlayer } from './BottomMediaPlayer'
import { FileNavigatorModal } from './FileNavigatorModal'
import { useAudioPlayerContext } from '../contexts/AudioPlayerContext'
import { useFileManager } from '../contexts/FileManagerContext'
import { theme } from '../utils/theme'
import { showMoveSuccessToast, getRelativePathFromRecordings, pathToNavigationArray } from '../utils/moveUtils'

/**
 * TabsWithMediaPlayer Component
 * Wraps the tab navigation with a persistent bottom media player
 * The media player appears above the tab bar and persists across navigation
 */
export function TabsWithMediaPlayer() {
  const audioPlayer = useAudioPlayerContext()
  const fileManager = useFileManager()

  // State for file operations
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [selectedFileForMove, setSelectedFileForMove] = useState<{ name: string; path: string } | null>(null)

  // Calculate bottom spacing to account for tab bar
  const tabBarHeight = 80 // Approximate tab bar height including safe area

  // File operation handlers
  const handleRenameFile = useCallback(() => {
    if (!audioPlayer.currentClip) return

    const fileExtension = audioPlayer.currentClip.name.split('.').pop()
    const nameWithoutExtension = audioPlayer.currentClip.name.replace(`.${fileExtension}`, '')

    Alert.prompt(
      'Rename Audio File',
      'Enter new file name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: async newName => {
            if (newName?.trim() && newName.trim() !== nameWithoutExtension) {
              try {
                const oldPath = audioPlayer.currentClip!.uri.replace('file://', '')
                const pathParts = oldPath.split('/')
                pathParts[pathParts.length - 1] = `${newName.trim()}.${fileExtension}`
                const newPath = pathParts.join('/')

                await FileSystem.moveAsync({ from: oldPath, to: newPath })

                // Update the current clip with new name and path
                const updatedClip = {
                  ...audioPlayer.currentClip!,
                  name: `${newName.trim()}.${fileExtension}`,
                  uri: `file://${newPath}`,
                }

                // Stop current playback and restart with updated clip
                audioPlayer.cleanup()
                await audioPlayer.playClip(updatedClip)

                // Refresh the file listing to show the new name
                fileManager.refreshCurrentDirectory()
              } catch (error) {
                console.error('Failed to rename audio file:', error)
                Alert.alert('Error', 'Failed to rename audio file')
              }
            }
          },
        },
      ],
      'plain-text',
      nameWithoutExtension
    )
  }, [audioPlayer])

  const handleMoveFile = useCallback(() => {
    if (!audioPlayer.currentClip) return

    setSelectedFileForMove({
      name: audioPlayer.currentClip.name,
      path: audioPlayer.currentClip.uri.replace('file://', ''),
    })
    setShowMoveModal(true)
  }, [audioPlayer])

  const handleDeleteFile = useCallback(() => {
    if (!audioPlayer.currentClip) return

    Alert.alert('Delete Audio File', `Are you sure you want to delete "${audioPlayer.currentClip.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const filePath = audioPlayer.currentClip!.uri.replace('file://', '')

            // Stop playback first
            audioPlayer.cleanup()

            // Move to recently deleted (or delete permanently)
            // For now, we'll delete permanently - you can implement recently deleted later
            await FileSystem.deleteAsync(filePath)

            // Refresh the file listing to remove the deleted file
            fileManager.refreshCurrentDirectory()

            Alert.alert('Success', 'Audio file deleted successfully')
          } catch (error) {
            console.error('Failed to delete audio file:', error)
            Alert.alert('Error', 'Failed to delete audio file')
          }
        },
      },
    ])
  }, [audioPlayer])

  const handleMoveConfirm = useCallback(
    async (destinationPath: string) => {
      if (!selectedFileForMove) return

      try {
        const fileName = selectedFileForMove.name
        const newPath = `${destinationPath}/${fileName}`

        await FileSystem.moveAsync({
          from: selectedFileForMove.path,
          to: newPath,
        })

        // Show success toast
        const recordingsBasePath = fileManager
          .getFullPath()
          .replace(fileManager.getCurrentPathString(), '')
          .replace(/\/$/, '')
        const relativePath = getRelativePathFromRecordings(destinationPath, recordingsBasePath)

        showMoveSuccessToast(fileName, () => {
          const navigationPath = pathToNavigationArray(relativePath)
          fileManager.navigateToPath(navigationPath)
        })

        // Stop current playback since file moved
        audioPlayer.cleanup()

        // Refresh the file listing to remove the moved file from source directory
        fileManager.refreshCurrentDirectory()

        setShowMoveModal(false)
        setSelectedFileForMove(null)
      } catch (error) {
        console.error('Failed to move file:', error)
        Alert.alert('Error', 'Failed to move file')
      }
    },
    [selectedFileForMove, fileManager, audioPlayer]
  )

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.tabBar.active,
          tabBarInactiveTintColor: theme.colors.tabBar.inactive,
          headerStyle: {
            backgroundColor: theme.colors.tabBar.background,
          },
          headerTintColor: theme.colors.text.primary,
          tabBarStyle: {
            backgroundColor: theme.colors.tabBar.background,
            borderTopColor: theme.colors.tabBar.border,
          },
        }}
      >
        <Tabs.Screen
          name="record"
          options={{
            title: 'Record',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="mic" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="browse"
          options={{
            title: 'Browse',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="folder" size={size} color={color} />,
          }}
        />
      </Tabs>

      {/* Persistent Bottom Media Player */}
      {audioPlayer.currentClip && (audioPlayer.duration > 0 || audioPlayer.currentClip.duration) && (
        <View style={[styles.mediaPlayerContainer, { bottom: tabBarHeight }]}>
          <BottomMediaPlayer
            title={audioPlayer.currentClip.name}
            isPlaying={audioPlayer.isPlaying}
            isVisible={true}
            currentTimeSeconds={audioPlayer.position}
            durationSeconds={audioPlayer.duration || audioPlayer.currentClip.duration || 0}
            onPlayPause={() => {
              if (audioPlayer.isPlaying) {
                audioPlayer.pauseClip()
              } else {
                audioPlayer.playClip(audioPlayer.currentClip!)
              }
            }}
            onSeek={audioPlayer.seekTo}
            onSkipForward={audioPlayer.skipForward}
            onSkipBackward={audioPlayer.skipBackward}
            onRename={handleRenameFile}
            onMove={handleMoveFile}
            onDelete={handleDeleteFile}
            style={styles.seamlessMediaPlayer}
          />
        </View>
      )}

      {/* File Navigator Modal for Move Operation */}
      {showMoveModal && selectedFileForMove && (
        <FileNavigatorModal
          visible={showMoveModal}
          onClose={() => {
            setShowMoveModal(false)
            setSelectedFileForMove(null)
          }}
          onSelectFolder={folder => {
            handleMoveConfirm(folder.path)
          }}
          title={`Move ${selectedFileForMove.name}`}
          primaryButtonText="Move"
          onPrimaryAction={currentPath => {
            handleMoveConfirm(currentPath)
          }}
          initialDirectory={fileManager.getFullPath()}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mediaPlayerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000, // Ensure it appears above other content
  },
  seamlessMediaPlayer: {
    width: '100%', // Ensure full width
  },
})
