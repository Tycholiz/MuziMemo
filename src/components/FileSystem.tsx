import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'
import Toast from 'react-native-toast-message'

import { useFileManager } from '../contexts/FileManagerContext'
import { useAudioPlayerContext } from '../contexts/AudioPlayerContext'
import { useMediaPlayerSpacing } from '../hooks/useMediaPlayerSpacing'
import { AudioMetadataService } from '../services/AudioMetadataService'
import { Breadcrumbs } from './Breadcrumbs'
import { AudioClipCard } from './AudioClipCard'
import { FolderContextMenuModal } from './FolderContextMenuModal'
import { CreateFolderModal } from './CreateFolderModal'
import { FileNavigatorModal } from './FileNavigatorModal'
import { HomeScreenMenuModal } from './HomeScreenMenuModal'
import { MultiSelectToolbar } from './MultiSelectToolbar'
import { SortModal } from './SortModal'
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
  deleteFolderAndMoveAudioFiles,
} from '../utils/recentlyDeletedUtils'
import { SortOption, DEFAULT_SORT_OPTION, sortAudioFiles, sortFolders } from '../utils/sortUtils'
import { loadSortPreference, saveSortPreference } from '../utils/storageUtils'

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
  const { bottomPadding } = useMediaPlayerSpacing()

  const [folders, setFolders] = useState<FolderData[]>([])
  const [audioFiles, setAudioFiles] = useState<AudioFileData[]>([])
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [selectedFolderForMove, setSelectedFolderForMove] = useState<FolderData | null>(null)
  const [selectedFileForMove, setSelectedFileForMove] = useState<AudioFileData | null>(null)
  const [selectedFileForRestore, setSelectedFileForRestore] = useState<AudioFileData | null>(null)
  const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT_OPTION)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Scroll position preservation
  const scrollViewRef = useRef<ScrollView>(null)
  const scrollPositionRef = useRef(0)
  const shouldRestoreScrollRef = useRef(false)

  // Memoized sorted arrays to prevent unnecessary re-renders
  const sortedFolders = useMemo(() => {
    return sortFolders(folders)
  }, [folders])

  const sortedAudioFiles = useMemo(() => {
    return sortAudioFiles(audioFiles, sortOption)
  }, [audioFiles, sortOption])

  // Load folder contents when path changes or refresh is triggered
  useEffect(() => {
    loadFolderContents()
  }, [fileManager.currentPath, fileManager.refreshTrigger])

  // Load saved sort preference on mount
  useEffect(() => {
    const loadSavedSortPreference = async () => {
      try {
        const savedSort = await loadSortPreference()
        setSortOption(savedSort)
      } catch (error) {
        console.error('Failed to load sort preference:', error)
        // Keep default sort option
      }
    }

    loadSavedSortPreference()
  }, [])

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
          // Skip recently-deleted folder from normal folder listings
          if (item === 'recently-deleted') {
            continue
          }

          // Count items in folder
          const subItems = await FileSystem.readDirectoryAsync(itemPath)
          folderList.push({
            id: `folder-${item}`,
            name: item,
            itemCount: subItems.length,
          })
        } else if (item.endsWith('.m4a') || item.endsWith('.mp3') || item.endsWith('.wav')) {
          // Try to get the most accurate timestamp available
          let timestamp = Date.now() // fallback to current time

          // Check for creation time first, then modification time
          if ((itemInfo as any).creationTime) {
            timestamp = (itemInfo as any).creationTime
          } else if ((itemInfo as any).modificationTime) {
            timestamp = (itemInfo as any).modificationTime
          }

          // Ensure we have a valid timestamp (not epoch time)
          if (timestamp === 0 || timestamp < 946684800000) {
            // Jan 1, 2000
            timestamp = Date.now()
          }

          // Get audio duration from metadata
          let duration: number | undefined
          try {
            const metadata = await AudioMetadataService.getMetadata(itemPath)
            duration = metadata.duration > 0 ? metadata.duration : undefined
          } catch (error) {
            // Duration will remain undefined if metadata extraction fails
            console.warn(`Failed to get duration for ${item}:`, error)
          }

          audioFileList.push({
            id: `audio-${item}`,
            name: item,
            uri: itemPath,
            size: (itemInfo as any).size || 0,
            createdAt: new Date((itemInfo as any).modificationTime * 1000),
            duration,
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
      // Navigate into the folder
      fileManager.navigateToFolder(folder.name)
    },
    [fileManager]
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

  const handleSortChange = useCallback(async (newSortOption: SortOption) => {
    setSortOption(newSortOption)
    setShowSortDropdown(false)

    // Save preference to storage
    try {
      await saveSortPreference(newSortOption)
    } catch (error) {
      console.error('Failed to save sort preference:', error)
      // Continue anyway - sorting will still work for current session
    }
  }, [])

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
          ? `Delete "${folder.name}" and move all audio files to Recently Deleted?`
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

              // Move all audio files to recently-deleted and delete the folder
              const movedAudioCount = await deleteFolderAndMoveAudioFiles(folderPath, folder.name)

              // Show success message if audio files were moved
              if (movedAudioCount > 0) {
                const fileText = movedAudioCount === 1 ? 'audio file' : 'audio files'
                Toast.show({
                  type: 'success',
                  text1: `Folder deleted`,
                  text2: `${movedAudioCount} ${fileText} moved to Recently Deleted`,
                  visibilityTime: 4000,
                })
              }

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

  // Fallback sharing using React Native's built-in Share API
  const shareWithReactNative = useCallback(async (audioFile: AudioFileData) => {
    console.log('🔄 Attempting React Native Share fallback...')
    try {
      const result = await Share.share({
        url: audioFile.uri,
        title: `Share ${audioFile.name}`,
        message: `Sharing audio file: ${audioFile.name}`,
      })

      console.log('✅ React Native Share result:', result)

      if (result.action === Share.sharedAction) {
        console.log('✅ File shared successfully via React Native Share')
      } else if (result.action === Share.dismissedAction) {
        console.log('ℹ️ User dismissed the share dialog')
      }
    } catch (error) {
      console.error('❌ React Native Share failed:', error)
      throw error
    }
  }, [])

  // Test function to verify sharing works with a simple text share
  const testSharing = useCallback(async () => {
    console.log('🧪 Testing basic sharing functionality...')
    try {
      if (Platform.OS === 'web') {
        console.log('❌ Web platform - sharing not supported')
        Alert.alert('Test Result', 'Web platform - sharing not supported')
        return
      }

      const isAvailable = await Sharing.isAvailableAsync()
      console.log('🧪 Sharing available:', isAvailable)

      if (!isAvailable) {
        Alert.alert('Test Result', 'Sharing not available on this device')
        return
      }

      // Try sharing a simple text message first with delay and timeout
      console.log('🧪 Adding delay before test sharing...')
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log('🧪 Attempting to share test message with timeout...')
      const sharePromise = Sharing.shareAsync('data:text/plain;base64,' + btoa('Test sharing from MuziMemo'))
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test sharing timeout')), 10000)
      )

      const result = await Promise.race([sharePromise, timeoutPromise])
      console.log('🧪 Test sharing result:', result)
      Alert.alert('Test Result', 'Basic sharing test completed successfully!')
    } catch (error) {
      console.error('🧪 Test sharing failed:', error)
      Alert.alert('Test Result', `Test failed: ${error.message}`)
    }
  }, [])

  const handleShareAudioFile = useCallback(async (audioFile: AudioFileData) => {
    console.log('🔄 About to share audio file:', audioFile.name)
    console.log('🔄 Audio file URI:', audioFile.uri)
    console.log('🔄 Platform:', Platform.OS)

    try {
      // Web platform doesn't support expo-sharing
      if (Platform.OS === 'web') {
        console.log('❌ Sharing not supported on web platform')
        Alert.alert(
          'Sharing Not Available',
          'File sharing is not available on the web version. Please use the mobile app.'
        )
        return
      }

      // Check if sharing is available on this platform
      console.log('🔄 Checking if sharing is available...')
      const isAvailable = await Sharing.isAvailableAsync()
      console.log('🔄 Sharing available:', isAvailable)

      if (!isAvailable) {
        console.log('❌ Sharing not available on this platform')
        Alert.alert('Sharing Not Available', 'Sharing is not available on this device.')
        return
      }

      // Verify file exists before sharing
      console.log('🔄 Verifying file exists...')
      const fileInfo = await FileSystem.getInfoAsync(audioFile.uri)
      console.log('🔄 File info:', JSON.stringify(fileInfo, null, 2))

      if (!fileInfo.exists) {
        console.log('❌ File does not exist at URI:', audioFile.uri)
        Alert.alert('File Not Found', 'The audio file could not be found. It may have been moved or deleted.')
        return
      }

      // Determine MIME type based on file extension
      const fileExtension = audioFile.name.toLowerCase().split('.').pop()
      let mimeType = 'audio/m4a' // default

      switch (fileExtension) {
        case 'mp3':
          mimeType = 'audio/mpeg'
          break
        case 'wav':
          mimeType = 'audio/wav'
          break
        case 'm4a':
        default:
          mimeType = 'audio/m4a'
          break
      }

      console.log('🔄 Using MIME type:', mimeType)
      console.log('🔄 File size:', fileInfo.size, 'bytes')

      // Add delay to prevent hanging issue (known expo-sharing bug)
      console.log('🔄 Adding 500ms delay to prevent hanging...')
      await new Promise(resolve => setTimeout(resolve, 500))

      // Try sharing with timeout to prevent indefinite hanging
      console.log('🔄 Attempting to share with timeout protection...')

      try {
        const sharePromise = Sharing.shareAsync(audioFile.uri, {
          mimeType,
          dialogTitle: `Share ${audioFile.name}`,
        })

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Sharing timeout after 15 seconds')), 15000)
        )

        const result = await Promise.race([sharePromise, timeoutPromise])
        console.log('✅ Sharing completed successfully:', JSON.stringify(result, null, 2))
      } catch (shareError) {
        console.log('❌ First sharing attempt failed, trying fallback...')
        console.error('Share error details:', shareError)

        if (shareError.message?.includes('timeout')) {
          throw new Error('Sharing timed out. Please try again or restart the app if the issue persists.')
        }

        // Fallback: try sharing without options with timeout
        console.log('🔄 Trying fallback sharing without options...')
        await new Promise(resolve => setTimeout(resolve, 500)) // Another delay for fallback

        const fallbackPromise = Sharing.shareAsync(audioFile.uri)
        const fallbackTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fallback sharing timeout after 15 seconds')), 15000)
        )

        const fallbackResult = await Promise.race([fallbackPromise, fallbackTimeoutPromise])
        console.log('✅ Fallback sharing completed:', JSON.stringify(fallbackResult, null, 2))
      }
    } catch (error) {
      console.error('❌ expo-sharing failed, trying React Native Share fallback:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))

      try {
        // Try React Native Share as fallback
        await shareWithReactNative(audioFile)
      } catch (fallbackError) {
        console.error('❌ All sharing methods failed:', fallbackError)

        let errorMessage = 'Failed to share the audio file. Please try again.'
        if (error.message?.includes('timeout')) {
          errorMessage = 'Sharing timed out. Please restart the app and try again.'
        } else if (error.message) {
          errorMessage = `Failed to share: ${error.message}`
        }

        Alert.alert('Share Error', errorMessage)
      }
    }
  }, [])

  const handleMoveConfirm = async (destinationPath: string) => {
    try {
      const recordingsBasePath = fileManager
        .getFullPath()
        .replace(fileManager.getCurrentPathString(), '')
        .replace(/\/$/, '')

      if (isMultiSelectMode && selectedItems.size > 0) {
        // Batch move for multi-select
        let successCount = 0
        const failedItems: string[] = []

        for (const itemId of selectedItems) {
          try {
            if (itemId.startsWith('folder-')) {
              const folderName = itemId.replace('folder-', '')
              const sourcePath = `${fileManager.getFullPath()}/${folderName}`
              await moveItem(sourcePath, destinationPath, folderName)
            } else if (itemId.startsWith('audio-')) {
              const fileName = itemId.replace('audio-', '')
              const sourcePath = `${fileManager.getFullPath()}/${fileName}`
              await moveItem(sourcePath, destinationPath, fileName)
            }
            successCount++
          } catch (error: any) {
            console.error(`Failed to move item ${itemId}:`, error)
            failedItems.push(itemId.replace(/^(folder-|audio-)/, ''))
          }
        }

        // Show appropriate toast messages
        if (successCount > 0) {
          const relativePath = getRelativePathFromRecordings(destinationPath, recordingsBasePath)
          showMoveSuccessToast(`${successCount} item${successCount !== 1 ? 's' : ''}`, () => {
            const navigationPath = pathToNavigationArray(relativePath)
            fileManager.navigateToPath(navigationPath)
          })
        }

        if (failedItems.length > 0) {
          showMoveErrorToast(`Failed to move: ${failedItems.join(', ')}`)
        }

        // Exit multi-select mode
        setIsMultiSelectMode(false)
        setSelectedItems(new Set())
      } else if (selectedFolderForMove) {
        // Moving a single folder
        const sourcePath = `${fileManager.getFullPath()}/${selectedFolderForMove.name}`
        await moveItem(sourcePath, destinationPath, selectedFolderForMove.name)

        // Show success toast with navigation
        const relativePath = getRelativePathFromRecordings(destinationPath, recordingsBasePath)
        showMoveSuccessToast(selectedFolderForMove.name, () => {
          const navigationPath = pathToNavigationArray(relativePath)
          fileManager.navigateToPath(navigationPath)
        })
      } else if (selectedFileForMove) {
        // Moving a single file
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

  // Multi-select handlers
  const handleMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode(true)
    setSelectedItems(new Set())
  }, [])

  const handleMultiSelectCancel = useCallback(() => {
    setIsMultiSelectMode(false)
    setSelectedItems(new Set())
  }, [])

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }, [])

  const handleMultiSelectMove = useCallback(() => {
    if (selectedItems.size === 0) return

    // Create excludePaths array from selected folder items
    const excludePaths: string[] = []
    const currentPath = fileManager.getFullPath()

    selectedItems.forEach(itemId => {
      if (itemId.startsWith('folder-')) {
        const folderName = itemId.replace('folder-', '')
        excludePaths.push(`${currentPath}/${folderName}`)
      }
    })

    setShowMoveModal(true)
  }, [selectedItems, fileManager])

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
            <HomeScreenMenuModal
              onRecentlyDeleted={handleNavigateToRecentlyDeleted}
              onMultiSelect={handleMultiSelectMode}
            />
          </View>
        )}
      </View>

      {/* Multi-Select Toolbar */}
      {isMultiSelectMode && (
        <MultiSelectToolbar
          selectedCount={selectedItems.size}
          onCancel={handleMultiSelectCancel}
          onMove={handleMultiSelectMove}
        />
      )}

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
      >
        {/* Folders Grid */}
        {sortedFolders.length > 0 && (
          <View style={styles.foldersGrid}>
            {sortedFolders.map(folder => {
              const isSelected = selectedItems.has(folder.id)
              const handlePress = isMultiSelectMode
                ? () => toggleItemSelection(folder.id)
                : () => handleFolderPress(folder)

              return (
                <View key={folder.id} style={styles.folderCard}>
                  <TouchableOpacity style={styles.folderContent} onPress={handlePress} activeOpacity={0.7}>
                    <View style={styles.folderIcon}>
                      <Ionicons name="folder" size={40} color="#FF4444" />
                    </View>
                    <Text style={styles.folderName} numberOfLines={1} ellipsizeMode="tail">
                      {folder.name}
                    </Text>
                    <Text style={styles.folderItemCount}>{folder.itemCount} items</Text>
                  </TouchableOpacity>

                  {/* Multi-select checkmark */}
                  {isMultiSelectMode && (
                    <View style={styles.folderCheckmark}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={isSelected ? theme.colors.primary : theme.colors.text.secondary}
                      />
                    </View>
                  )}

                  {!isMultiSelectMode && (
                    <View style={styles.folderMenuContainer}>
                      <FolderContextMenuModal
                        onRename={() => handleRenameFolder(folder)}
                        onMove={() => handleMoveFolder(folder)}
                        onDelete={() => handleDeleteFolder(folder)}
                      />
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}

        {/* Folders Empty State */}
        {sortedFolders.length === 0 && !fileManager.getIsInRecentlyDeleted() && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color={theme.colors.text.secondary} />
            <Text style={styles.emptyStateText}>No folders yet</Text>
            <Text style={styles.emptyStateSubtext}>Create your first folder to organize recordings</Text>
          </View>
        )}

        {/* Action Buttons - Hidden in Recently Deleted */}
        {!fileManager.getIsInRecentlyDeleted() && (
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
        )}

        {/* Audio Files Header with Sort Button */}
        <View style={styles.audioFilesHeader}>
          <Text style={[styles.actionButtonText, styles.audioFilesText]}>
            {sortedAudioFiles.length} audio file{sortedAudioFiles.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortDropdown(true)} activeOpacity={0.7}>
            <Ionicons name="funnel" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        {sortedAudioFiles.map(audioFile => {
          const handlePlay = () => audioPlayer.playClip(audioFile)
          const handlePause = () => audioPlayer.pauseClip()
          const handleRename = () => handleRenameAudioFile(audioFile)
          const handleMove = () => handleMoveAudioFile(audioFile)
          const handleRestore = () => handleRestoreAudioFile(audioFile)
          const handleShare = () => handleShareAudioFile(audioFile)
          const handleDelete = () => handleDeleteAudioFile(audioFile)
          const isInRecentlyDeletedFolder = fileManager.getIsInRecentlyDeleted()
          const isSelected = selectedItems.has(audioFile.id)
          const handleToggleSelection = () => toggleItemSelection(audioFile.id)

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
              onShare={handleShare}
              onDelete={handleDelete}
              isInRecentlyDeleted={isInRecentlyDeletedFolder}
              isMultiSelectMode={isMultiSelectMode}
              isSelected={isSelected}
              onToggleSelection={handleToggleSelection}
            />
          )
        })}

        {/* Audio Files Empty State */}
        {sortedAudioFiles.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name={fileManager.getIsInRecentlyDeleted() ? 'trash-outline' : 'musical-notes-outline'}
              size={64}
              color={theme.colors.text.secondary}
            />
            <Text style={styles.emptyStateText}>
              {fileManager.getIsInRecentlyDeleted() ? 'Your recycling bin is empty' : 'No recordings yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {fileManager.getIsInRecentlyDeleted()
                ? 'Deleted audio files will appear here'
                : 'Tap Record to create your first recording'}
            </Text>
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
        title={
          isMultiSelectMode && selectedItems.size > 0
            ? `Move ${selectedItems.size} item${selectedItems.size !== 1 ? 's' : ''}`
            : `Move ${selectedFolderForMove ? selectedFolderForMove.name : selectedFileForMove?.name || ''}`
        }
        primaryButtonText="Move Here"
        primaryButtonIcon="arrow-forward"
        onPrimaryAction={handleMoveConfirm}
        initialDirectory={fileManager.getFullPath()}
        excludePath={selectedFolderForMove ? `${fileManager.getFullPath()}/${selectedFolderForMove.name}` : undefined}
        excludePaths={
          isMultiSelectMode && selectedItems.size > 0
            ? Array.from(selectedItems)
                .filter(itemId => itemId.startsWith('folder-'))
                .map(itemId => `${fileManager.getFullPath()}/${itemId.replace('folder-', '')}`)
            : undefined
        }
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

      {/* Sort Modal */}
      <SortModal
        visible={showSortDropdown}
        currentSortOption={sortOption}
        onSelectSort={handleSortChange}
        onClose={() => setShowSortDropdown(false)}
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
  audioFilesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  audioFilesText: {
    flex: 1,
  },
  sortButton: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.surface.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
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
  folderCheckmark: {
    position: 'absolute',
    top: 4,
    left: 4,
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
