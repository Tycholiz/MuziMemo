import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as FileSystem from 'expo-file-system'

import { useFileManager } from '../contexts/FileManagerContext'
import { useAudioPlayerContext } from '../contexts/AudioPlayerContext'
import { Breadcrumbs } from './Breadcrumbs'
import { AudioClipCard } from './AudioClipCard'
import { FolderContextMenuModal } from './FolderContextMenuModal'
import { CreateFolderModal } from './CreateFolderModal'
import { FileNavigatorModal } from './FileNavigatorModal'
import { HomeScreenMenuModal } from './HomeScreenMenuModal'
import { theme } from '../utils/theme'
import {
  moveItem,
  showMoveSuccessToast,
  showMoveErrorToast,
  getRelativePathFromRecordings,
  pathToNavigationArray,
} from '../utils/moveUtils'
import {
  moveToRecentlyDeleted,
  restoreFromRecentlyDeleted,
  showRestoreSuccessToast,
  showRestoreErrorToast,
} from '../utils/recentlyDeletedUtils'

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

export function FileSystemComponent() {
  const router = useRouter()
  const fileManager = useFileManager()
  const audioPlayer = useAudioPlayerContext()

  const [folders, setFolders] = useState<FolderData[]>([])
  const [audioFiles, setAudioFiles] = useState<AudioFileData[]>([])
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [selectedFolderForMove, setSelectedFolderForMove] = useState<FolderData | null>(null)
  const [selectedFileForMove, setSelectedFileForMove] = useState<AudioFileData | null>(null)
  const [selectedFileForRestore, setSelectedFileForRestore] = useState<AudioFileData | null>(null)

  // Scroll position preservation
  const scrollViewRef = useRef<ScrollView>(null)
  const scrollPositionRef = useRef(0)
  const shouldRestoreScrollRef = useRef(false)

  // Memoized sorted arrays to prevent unnecessary re-renders
  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => a.name.localeCompare(b.name))
  }, [folders])

  const sortedAudioFiles = useMemo(() => {
    return [...audioFiles].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }, [audioFiles])

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

      // Set state without sorting (sorting is handled by useMemo)
      setFolders(folderList)
      setAudioFiles(audioFileList)
    } catch (error) {
      console.error('Failed to load folder contents:', error)
      fileManager.setError('Failed to load folder contents')
    } finally {
      fileManager.setLoading(false)
    }
  }

  // Scroll position tracking functions
  const handleScroll = useCallback((event: any) => {
    scrollPositionRef.current = event.nativeEvent.contentOffset.y
  }, [])

  const handleContentSizeChange = useCallback(() => {
    if (shouldRestoreScrollRef.current && scrollViewRef.current) {
      // Restore scroll position after content update
      scrollViewRef.current.scrollTo({
        y: scrollPositionRef.current,
        animated: false,
      })
      shouldRestoreScrollRef.current = false
    }
  }, [])

  const handleFolderPress = useCallback(
    (folder: FolderData) => {
      // Stop current playback when navigating to a different folder
      audioPlayer.cleanup()

      // Navigate into the folder
      fileManager.navigateToFolder(folder.name)
    },
    [audioPlayer, fileManager]
  )

  const handleRecordButtonPress = useCallback(() => {
    const currentPathString = fileManager.getCurrentPathString()
    const folderName = currentPathString || 'root'
    console.log('folderName: ', folderName)

    // Default navigation to record screen
    router.push({
      pathname: '/(tabs)/record',
      params: {
        initialFolder: folderName,
        intentional: 'true',
      },
    })
  }, [fileManager, router])

  const handleNavigateToRecentlyDeleted = useCallback(() => {
    // Stop current playback when navigating to recently deleted
    audioPlayer.cleanup()

    // Navigate to recently deleted
    fileManager.navigateToRecentlyDeleted()
  }, [audioPlayer, fileManager])

  const handleCreateFolder = useCallback(
    async (folderName: string) => {
      const newFolder: FolderData = {
        id: `folder-${folderName}`,
        name: folderName,
        itemCount: 0,
      }

      // Optimistic update: add to state immediately
      setFolders(prev => [...prev, newFolder])

      try {
        const fullPath = fileManager.getFullPath()
        const newFolderPath = `${fullPath}/${folderName}`
        await FileSystem.makeDirectoryAsync(newFolderPath)
        // Success - folder already added to state
      } catch (error) {
        console.error('Failed to create folder:', error)
        // Rollback: remove the folder from state
        setFolders(prev => prev.filter(f => f.id !== newFolder.id))
        Alert.alert('Error', 'Failed to create folder')
      }
    },
    [fileManager]
  )

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

  const handleDeleteFolder = useCallback(
    async (folder: FolderData) => {
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
            // Optimistic update: remove from state immediately
            setFolders(prev => prev.filter(f => f.id !== folder.id))

            try {
              const fullPath = fileManager.getFullPath()
              const folderPath = `${fullPath}/${folder.name}`
              await FileSystem.deleteAsync(folderPath)
              // Success - folder already removed from state
            } catch (error) {
              console.error('Failed to delete folder:', error)
              // Rollback: add the folder back to state
              setFolders(prev => [...prev, folder])
              Alert.alert('Error', 'Failed to delete folder')
            }
          },
        },
      ])
    },
    [fileManager]
  )

  const handleMoveFolder = useCallback(async (folder: FolderData) => {
    setSelectedFolderForMove(folder)
    setShowMoveModal(true)
  }, [])

  const handleRenameAudioFile = useCallback(
    async (audioFile: AudioFileData) => {
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
    },
    [fileManager]
  )

  const handleDeleteAudioFile = useCallback(
    async (audioFile: AudioFileData) => {
      const isInRecentlyDeletedFolder = fileManager.getIsInRecentlyDeleted()
      const actionText = isInRecentlyDeletedFolder ? 'permanently delete' : 'delete'
      const alertTitle = isInRecentlyDeletedFolder ? 'Permanently Delete Audio File' : 'Delete Audio File'

      Alert.alert(alertTitle, `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} "${audioFile.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isInRecentlyDeletedFolder ? 'Permanently Delete' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Stop playback if this file is currently playing
            if (audioPlayer.currentClip?.id === audioFile.id) {
              audioPlayer.cleanup()
            }

            // Optimistic update: remove from state immediately
            setAudioFiles(prev => prev.filter(file => file.id !== audioFile.id))

            try {
              const fullPath = fileManager.getFullPath()
              const filePath = `${fullPath}/${audioFile.name}`

              if (isInRecentlyDeletedFolder) {
                // Permanently delete from recently-deleted
                await FileSystem.deleteAsync(filePath)
              } else {
                // Move to recently-deleted instead of permanent deletion
                await moveToRecentlyDeleted(filePath, audioFile.name)
              }
              // Success - item already removed from state
            } catch (error) {
              console.error('Failed to delete audio file:', error)
              // Rollback: add the file back to state
              setAudioFiles(prev => [...prev, audioFile])
              Alert.alert('Error', 'Failed to delete audio file')
            }
          },
        },
      ])
    },
    [audioPlayer, fileManager]
  )

  const handleMoveAudioFile = useCallback(async (audioFile: AudioFileData) => {
    setSelectedFileForMove(audioFile)
    setSelectedFolderForMove(null)
    setShowMoveModal(true)
  }, [])

  const handleRestoreAudioFile = useCallback(async (audioFile: AudioFileData) => {
    setSelectedFileForRestore(audioFile)
    setShowRestoreModal(true)
  }, [])

  const handleMoveConfirm = async (destinationPath: string) => {
    try {
      const recordingsBasePath = fileManager
        .getFullPath()
        .replace(fileManager.getCurrentPathString(), '')
        .replace(/\/$/, '')

      if (selectedFolderForMove) {
        // Moving a folder
        const sourcePath = `${fileManager.getFullPath()}/${selectedFolderForMove.name}`
        await moveItem(sourcePath, destinationPath, selectedFolderForMove.name)

        // Show success toast with navigation
        const relativePath = getRelativePathFromRecordings(destinationPath, recordingsBasePath)
        showMoveSuccessToast(selectedFolderForMove.name, () => {
          const navigationPath = pathToNavigationArray(relativePath)
          fileManager.navigateToPath(navigationPath)
        })
      } else if (selectedFileForMove) {
        // Moving a file
        const sourcePath = `${fileManager.getFullPath()}/${selectedFileForMove.name}`
        await moveItem(sourcePath, destinationPath, selectedFileForMove.name)

        // Show success toast with navigation
        const relativePath = getRelativePathFromRecordings(destinationPath, recordingsBasePath)
        showMoveSuccessToast(selectedFileForMove.name, () => {
          const navigationPath = pathToNavigationArray(relativePath)
          fileManager.navigateToPath(navigationPath)
        })
      }

      // Refresh the current folder contents
      await loadFolderContents()
    } catch (error: any) {
      console.error('Failed to move item:', error)
      showMoveErrorToast(error.message || 'Failed to move item')
    } finally {
      setShowMoveModal(false)
      setSelectedFolderForMove(null)
      setSelectedFileForMove(null)
    }
  }

  const handleMoveCancelOrClose = () => {
    setShowMoveModal(false)
    setSelectedFolderForMove(null)
    setSelectedFileForMove(null)
  }

  const handleRestoreConfirm = async (destinationPath: string) => {
    try {
      // Get the recordings base path correctly (not from currently-deleted directory)
      const documentsDirectory = FileSystem.documentDirectory
      const recordingsBasePath = documentsDirectory ? `${documentsDirectory}recordings` : ''

      if (selectedFileForRestore) {
        // Restoring a file from recently-deleted
        const sourcePath = `${fileManager.getFullPath()}/${selectedFileForRestore.name}`
        await restoreFromRecentlyDeleted(sourcePath, destinationPath, selectedFileForRestore.name)

        // Remove from current view (recently-deleted)
        setAudioFiles(prev => prev.filter(file => file.id !== selectedFileForRestore.id))

        // Show success toast with navigation
        const relativePath = getRelativePathFromRecordings(destinationPath, recordingsBasePath)
        showRestoreSuccessToast(selectedFileForRestore.name, () => {
          const navigationPath = pathToNavigationArray(relativePath)
          fileManager.navigateToPath(navigationPath)
        })
      }
    } catch (error: any) {
      console.error('Failed to restore item:', error)
      showRestoreErrorToast(error.message || 'Failed to restore item')
    } finally {
      setShowRestoreModal(false)
      setSelectedFileForRestore(null)
    }
  }

  const handleRestoreCancelOrClose = () => {
    setShowRestoreModal(false)
    setSelectedFileForRestore(null)
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
      {/* Header with Breadcrumbs and Menu */}
      <View style={styles.header}>
        <View style={styles.breadcrumbsContainer}>
          <Breadcrumbs />
        </View>
        {!fileManager.getIsInRecentlyDeleted() && (
          <View style={styles.headerMenuContainer}>
            <HomeScreenMenuModal onRecentlyDeleted={handleNavigateToRecentlyDeleted} />
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
      >
        {/* Folders Grid */}
        {sortedFolders.length > 0 && (
          <View style={styles.foldersGrid}>
            {sortedFolders.map(folder => (
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

        {/* Audio Files */}
        <View>
          <Text style={[styles.actionButtonText, { marginVertical: 12 }]}>{sortedAudioFiles.length} audio files</Text>
        </View>
        {sortedAudioFiles.map(audioFile => {
          const handlePlay = () => audioPlayer.playClip(audioFile)
          const handlePause = () => audioPlayer.pauseClip()
          const handleRename = () => handleRenameAudioFile(audioFile)
          const handleMove = () => handleMoveAudioFile(audioFile)
          const handleRestore = () => handleRestoreAudioFile(audioFile)
          const handleDelete = () => handleDeleteAudioFile(audioFile)
          const isInRecentlyDeletedFolder = fileManager.getIsInRecentlyDeleted()

          return (
            <AudioClipCard
              key={audioFile.id}
              clip={audioFile}
              isPlaying={audioPlayer.currentClip?.id === audioFile.id && audioPlayer.isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onRename={handleRename}
              onMove={isInRecentlyDeletedFolder ? undefined : handleMove}
              onRestore={isInRecentlyDeletedFolder ? handleRestore : undefined}
              onDelete={handleDelete}
              isInRecentlyDeleted={isInRecentlyDeletedFolder}
            />
          )
        })}

        {/* Empty State */}
        {sortedFolders.length === 0 && sortedAudioFiles.length === 0 && (
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

      {/* Move Modal */}
      <FileNavigatorModal
        visible={showMoveModal}
        onClose={handleMoveCancelOrClose}
        onSelectFolder={() => {}} // Not used for move operations
        title={`Move ${selectedFolderForMove ? selectedFolderForMove.name : selectedFileForMove?.name || ''}`}
        primaryButtonText="Move Here"
        primaryButtonIcon="arrow-forward"
        onPrimaryAction={handleMoveConfirm}
        initialDirectory={fileManager.getFullPath()}
        excludePath={selectedFolderForMove ? `${fileManager.getFullPath()}/${selectedFolderForMove.name}` : undefined}
      />

      {/* Restore Modal */}
      <FileNavigatorModal
        visible={showRestoreModal}
        onClose={handleRestoreCancelOrClose}
        onSelectFolder={() => {}} // Not used for restore operations
        title={`Restore ${selectedFileForRestore?.name || ''}`}
        primaryButtonText="Restore Here"
        primaryButtonIcon="refresh"
        onPrimaryAction={handleRestoreConfirm}
        initialDirectory={`${FileSystem.documentDirectory}recordings`}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  breadcrumbsContainer: {
    flex: 1,
  },
  headerMenuContainer: {
    marginLeft: 8,
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
