import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as FileSystem from 'expo-file-system'

import { useFileManager } from '../contexts/FileManagerContext'
import { useAudioPlayerContext } from '../contexts/AudioPlayerContext'
import { Breadcrumbs } from './Breadcrumbs'
import { AudioClipCard } from './AudioClipCard'
import { FolderContextMenuModal } from './FolderContextMenuModal'
import { CreateFolderModal } from './CreateFolderModal'
import { theme } from '../utils/theme'

export type FolderData = {
  id: string
  name: string
  itemCount: number
}

export type AudioFileData = {
  id: string
  name: string
  uri: string
  size: number
  createdAt: Date
  duration?: number
}

type FileSystemProps = {
  onRecordPress?: () => void
}

export function FileSystemComponent({ onRecordPress }: FileSystemProps) {
  const fileManager = useFileManager()
  const audioPlayer = useAudioPlayerContext()

  const [folders, setFolders] = useState<FolderData[]>([])
  const [audioFiles, setAudioFiles] = useState<AudioFileData[]>([])
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)

  // Load folder contents when path changes
  useEffect(() => {
    loadFolderContents()
  }, [fileManager.currentPath])

  const loadFolderContents = async () => {
    try {
      fileManager.setLoading(true)
      fileManager.setError(null)

      const fullPath = fileManager.getFullPath()

      // Ensure the recordings directory exists
      const recordingsDir = `${FileSystem.documentDirectory}recordings`
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir)
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true })
      }

      // Ensure the current path exists
      const pathInfo = await FileSystem.getInfoAsync(fullPath)
      if (!pathInfo.exists) {
        await FileSystem.makeDirectoryAsync(fullPath, { intermediates: true })
      }

      // Read directory contents
      const items = await FileSystem.readDirectoryAsync(fullPath)

      const folderList: FolderData[] = []
      const audioFileList: AudioFileData[] = []

      for (const item of items) {
        const itemPath = `${fullPath}/${item}`
        const itemInfo = await FileSystem.getInfoAsync(itemPath)

        if (itemInfo.isDirectory) {
          // Count items in folder
          const subItems = await FileSystem.readDirectoryAsync(itemPath)
          folderList.push({
            id: `folder-${item}`,
            name: item,
            itemCount: subItems.length,
          })
        } else if (item.endsWith('.m4a') || item.endsWith('.mp3') || item.endsWith('.wav')) {
          audioFileList.push({
            id: `audio-${item}`,
            name: item,
            uri: itemPath,
            size: (itemInfo as any).size || 0,
            createdAt: new Date((itemInfo as any).modificationTime || Date.now()),
          })
        }
      }

      // Sort folders and files alphabetically
      folderList.sort((a, b) => a.name.localeCompare(b.name))
      audioFileList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      setFolders(folderList)
      setAudioFiles(audioFileList)
    } catch (error) {
      console.error('Failed to load folder contents:', error)
      fileManager.setError('Failed to load folder contents')
    } finally {
      fileManager.setLoading(false)
    }
  }

  const handleFolderPress = (folder: FolderData) => {
    // Stop current playback when navigating to a different folder
    audioPlayer.cleanup()

    // Navigate into the folder
    fileManager.navigateToFolder(folder.name)
  }

  const handleRecordButtonPress = () => {
    const currentPathString = fileManager.getCurrentPathString()
    const folderName = currentPathString || 'root'

    if (onRecordPress) {
      onRecordPress()
    } else {
      // Default navigation to record screen
      router.push({
        pathname: '/record',
        params: {
          initialFolder: folderName,
          intentional: 'true',
        },
      })
    }
  }

  const handleCreateFolder = async (folderName: string) => {
    try {
      const fullPath = fileManager.getFullPath()
      const newFolderPath = `${fullPath}/${folderName}`

      await FileSystem.makeDirectoryAsync(newFolderPath)
      await loadFolderContents() // Refresh the list
    } catch (error) {
      console.error('Failed to create folder:', error)
      Alert.alert('Error', 'Failed to create folder')
    }
  }

  const handleRenameFolder = async (folder: FolderData) => {
    Alert.prompt(
      'Rename Folder',
      'Enter new folder name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: async newName => {
            if (newName?.trim() && newName.trim() !== folder.name) {
              try {
                const fullPath = fileManager.getFullPath()
                const oldPath = `${fullPath}/${folder.name}`
                const newPath = `${fullPath}/${newName.trim()}`

                await FileSystem.moveAsync({ from: oldPath, to: newPath })
                await loadFolderContents() // Refresh the list
              } catch (error) {
                console.error('Failed to rename folder:', error)
                Alert.alert('Error', 'Failed to rename folder')
              }
            }
          },
        },
      ],
      'plain-text',
      folder.name
    )
  }

  const handleDeleteFolder = async (folder: FolderData) => {
    const message =
      folder.itemCount > 0
        ? `Delete "${folder.name}" and all ${folder.itemCount} items inside?`
        : `Delete "${folder.name}"?`

    Alert.alert('Delete Folder', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const fullPath = fileManager.getFullPath()
            const folderPath = `${fullPath}/${folder.name}`

            await FileSystem.deleteAsync(folderPath)
            await loadFolderContents() // Refresh the list
          } catch (error) {
            console.error('Failed to delete folder:', error)
            Alert.alert('Error', 'Failed to delete folder')
          }
        },
      },
    ])
  }

  const handleMoveFolder = async (folder: FolderData) => {
    // TODO: Implement move functionality with FileNavigatorModal
    Alert.alert('Move Folder', 'Move functionality will be implemented soon')
  }

  const handleRenameAudioFile = async (audioFile: AudioFileData) => {
    const fileExtension = audioFile.name.split('.').pop()
    const nameWithoutExtension = audioFile.name.replace(`.${fileExtension}`, '')

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
                const fullPath = fileManager.getFullPath()
                const oldPath = `${fullPath}/${audioFile.name}`
                const newPath = `${fullPath}/${newName.trim()}.${fileExtension}`

                await FileSystem.moveAsync({ from: oldPath, to: newPath })
                await loadFolderContents() // Refresh the list
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
  }

  const handleDeleteAudioFile = async (audioFile: AudioFileData) => {
    Alert.alert('Delete Audio File', `Delete "${audioFile.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const fullPath = fileManager.getFullPath()
            const filePath = `${fullPath}/${audioFile.name}`

            // Stop playback if this file is currently playing
            if (audioPlayer.currentClip?.id === audioFile.id) {
              audioPlayer.cleanup()
            }

            await FileSystem.deleteAsync(filePath)
            await loadFolderContents() // Refresh the list
          } catch (error) {
            console.error('Failed to delete audio file:', error)
            Alert.alert('Error', 'Failed to delete audio file')
          }
        },
      },
    ])
  }

  const handleMoveAudioFile = async (audioFile: AudioFileData) => {
    // TODO: Implement move functionality with FileNavigatorModal
    Alert.alert('Move Audio File', 'Move functionality will be implemented soon')
  }

  if (fileManager.isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (fileManager.error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{fileManager.error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFolderContents}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.newFolderButton]}
          onPress={() => setShowCreateFolderModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={[styles.actionButtonText, styles.newFolderButtonText]}>New Folder</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.recordButton]} onPress={handleRecordButtonPress}>
          <Ionicons name="mic" size={20} color="white" />
          <Text style={[styles.actionButtonText, styles.recordButtonText]}>Record</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Folders Grid */}
        {folders.length > 0 && (
          <View style={styles.foldersGrid}>
            {folders.map(folder => (
              <View key={folder.id} style={styles.folderCard}>
                <TouchableOpacity
                  style={styles.folderContent}
                  onPress={() => handleFolderPress(folder)}
                  activeOpacity={0.7}
                >
                  <View style={styles.folderIcon}>
                    <Ionicons name="folder" size={40} color="#FF4444" />
                  </View>
                  <Text style={styles.folderName} numberOfLines={1} ellipsizeMode="tail">
                    {folder.name}
                  </Text>
                  <Text style={styles.folderItemCount}>{folder.itemCount} items</Text>
                </TouchableOpacity>

                <View style={styles.folderMenuContainer}>
                  <FolderContextMenuModal
                    onRename={() => handleRenameFolder(folder)}
                    onMove={() => handleMoveFolder(folder)}
                    onDelete={() => handleDeleteFolder(folder)}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Audio Files */}
        {audioFiles.map(audioFile => (
          <AudioClipCard
            key={audioFile.id}
            clip={audioFile}
            isPlaying={audioPlayer.currentClip?.id === audioFile.id && audioPlayer.isPlaying}
            onPlay={() => audioPlayer.playClip(audioFile)}
            onPause={() => audioPlayer.pauseClip()}
            onRename={() => handleRenameAudioFile(audioFile)}
            onMove={() => handleMoveAudioFile(audioFile)}
            onDelete={() => handleDeleteAudioFile(audioFile)}
          />
        ))}

        {/* Empty State */}
        {folders.length === 0 && audioFiles.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color={theme.colors.text.secondary} />
            <Text style={styles.emptyStateText}>No recordings yet</Text>
            <Text style={styles.emptyStateSubtext}>Tap Record to create your first recording</Text>
          </View>
        )}
      </ScrollView>

      {/* Create Folder Modal */}
      <CreateFolderModal
        visible={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onCreateFolder={handleCreateFolder}
        currentPath={fileManager.getCurrentPathString()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.regular,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    fontFamily: theme.typography.fontFamily.regular,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.medium,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  newFolderButton: {
    backgroundColor: '#4CAF50', // Green color
  },
  recordButton: {
    backgroundColor: '#FF4444', // Red color
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  newFolderButtonText: {
    color: 'white',
  },
  recordButtonText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  folderCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: 12,
    marginBottom: 12,
    width: '31%', // 3 columns with small gaps
    minHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    position: 'relative',
  },
  folderContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  folderIcon: {
    marginBottom: 8,
  },
  folderName: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  folderItemCount: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  folderMenuContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
})
