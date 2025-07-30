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
          <Ionicons name="folder-outline" size={20} color={theme.colors.text.primary} />
          <Text style={styles.actionButtonText}>New Folder</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.recordButton]} onPress={handleRecordButtonPress}>
          <Ionicons name="mic" size={20} color="white" />
          <Text style={[styles.actionButtonText, styles.recordButtonText]}>Record</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Folders */}
        {folders.map(folder => (
          <View key={folder.id} style={styles.folderCard}>
            <TouchableOpacity
              style={styles.folderContent}
              onPress={() => handleFolderPress(folder)}
              activeOpacity={0.7}
            >
              <View style={styles.folderIcon}>
                <Ionicons name="folder" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.folderName}>{folder.name}</Text>
              <Text style={styles.folderItemCount}>{folder.itemCount} items</Text>
            </TouchableOpacity>

            <View style={styles.folderMenuContainer}>
              <FolderContextMenuModal
                onRename={() => {
                  /* TODO: Implement */
                }}
                onMove={() => {
                  /* TODO: Implement */
                }}
                onDelete={() => {
                  /* TODO: Implement */
                }}
              />
            </View>
          </View>
        ))}

        {/* Audio Files */}
        {audioFiles.map(audioFile => (
          <AudioClipCard
            key={audioFile.id}
            clip={audioFile}
            isPlaying={audioPlayer.currentClip?.id === audioFile.id && audioPlayer.isPlaying}
            onPlay={() => audioPlayer.playClip(audioFile)}
            onPause={() => audioPlayer.pauseClip()}
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
    backgroundColor: theme.colors.surface.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  recordButton: {
    backgroundColor: theme.colors.success,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  recordButtonText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  folderCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  folderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  folderIcon: {
    marginRight: 12,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  folderItemCount: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginRight: 8,
  },
  folderMenuContainer: {
    paddingRight: 8,
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
