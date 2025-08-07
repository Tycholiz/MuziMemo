import { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import * as FileSystem from 'expo-file-system'

import { useAudioPlayerContext } from '../contexts/AudioPlayerContext'
import { useFileManager } from '../contexts/FileManagerContext'
import { showMoveSuccessToast, getRelativePathFromRecordings, pathToNavigationArray } from '../utils/moveUtils'

/**
 * File operation state for move operations
 */
type FileForMove = {
  name: string
  path: string
}

/**
 * Return type for the useMediaPlayerFileOperations hook
 */
export type MediaPlayerFileOperations = {
  // File operation handlers
  handleRename: () => void
  handleMove: () => void
  handleDelete: () => void
  
  // Move modal state and handlers
  showMoveModal: boolean
  selectedFileForMove: FileForMove | null
  handleMoveConfirm: (destinationPath: string) => Promise<void>
  handleMoveCancel: () => void
}

/**
 * Custom hook that manages file operations for the media player
 * 
 * This hook encapsulates all file operation logic including:
 * - Renaming audio files with prompt handling
 * - Moving files with modal state management
 * - Deleting files with confirmation dialogs
 * - File system operations and error handling
 * - Audio player state updates after operations
 * 
 * @returns Object containing file operation handlers and move modal state
 */
export function useMediaPlayerFileOperations(): MediaPlayerFileOperations {
  const audioPlayer = useAudioPlayerContext()
  const fileManager = useFileManager()

  // State for move operations
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [selectedFileForMove, setSelectedFileForMove] = useState<FileForMove | null>(null)

  /**
   * Handles renaming the currently playing audio file
   * Shows a prompt dialog for the new name and updates the file system
   */
  const handleRename = useCallback(() => {
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
  }, [audioPlayer, fileManager])

  /**
   * Initiates the move operation for the currently playing audio file
   * Sets up the move modal state
   */
  const handleMove = useCallback(() => {
    if (!audioPlayer.currentClip) return

    setSelectedFileForMove({
      name: audioPlayer.currentClip.name,
      path: audioPlayer.currentClip.uri.replace('file://', ''),
    })
    setShowMoveModal(true)
  }, [audioPlayer])

  /**
   * Handles deleting the currently playing audio file
   * Shows a confirmation dialog and performs the deletion
   */
  const handleDelete = useCallback(() => {
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
  }, [audioPlayer, fileManager])

  /**
   * Confirms and executes the move operation to the specified destination
   * @param destinationPath - The target directory path for the move operation
   */
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

  /**
   * Cancels the move operation and resets the move modal state
   */
  const handleMoveCancel = useCallback(() => {
    setShowMoveModal(false)
    setSelectedFileForMove(null)
  }, [])

  return {
    handleRename,
    handleMove,
    handleDelete,
    showMoveModal,
    selectedFileForMove,
    handleMoveConfirm,
    handleMoveCancel,
  }
}
