import React, { useState, useEffect, useMemo } from 'react'
import { StyleSheet, Text, View, Alert } from 'react-native'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'

import { Screen, Container, Spacer } from '../components/Layout'
import { Icon } from '../components/Icon'
import {
  Dropdown,
  FileNavigatorModal,
  Button,
  SoundWave,
  RecordingStatusBadge,
  RecordButton,
  FolderSelectorWithGoTo,
} from '../components/index'
import type { Folder, FileNavigatorFolder, DropdownOption } from '../components/index'
import { useAudioRecording, type AudioQuality } from '../hooks/useAudioRecording'
import { useFileManager } from '../contexts/FileManagerContext'
import { theme } from '../utils/theme'
import { formatDurationFromSeconds, generateRecordingFilename } from '../utils/formatUtils'
import {
  joinPath,
  getRecordingsDirectory,
  doesFolderPathExist,
  getHierarchicalItemCount,
  getAbsolutePath,
} from '../utils/pathUtils'
import { fileSystemService } from '../services/FileSystemService'
import * as FileSystem from 'expo-file-system'

/**
 * RecordScreen Component
 * Main screen for audio recording functionality
 */
export default function RecordScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ initialFolder?: string }>()
  const initialFolder = Array.isArray(params.initialFolder) ? params.initialFolder[0] : params.initialFolder

  const fileManager = useFileManager()

  // State for audio quality
  const [audioQuality, setAudioQuality] = useState<AudioQuality>('high')

  const {
    status,
    duration,
    audioLevel,
    isInitialized,
    hasPermissions,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    requestPermissions,
  } = useAudioRecording(audioQuality)
  const [recordingUri, setRecordingUri] = useState<string | null>(null)

  // Simplified state - only store the folder path
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>('') // Store the full path for nested folders
  const [showFileNavigator, setShowFileNavigator] = useState(false)
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)

  // Memoized computed values derived from path
  const selectedFolderId = useMemo((): string => {
    if (!selectedFolderPath || selectedFolderPath === '') {
      return 'folder-root'
    }
    return `folder-${selectedFolderPath.replace(/\//g, '-')}`
  }, [selectedFolderPath])

  const selectedFolderDisplayName = useMemo((): string => {
    if (!selectedFolderPath || selectedFolderPath === '') {
      return 'Home'
    }
    // Show the full path for clarity
    return selectedFolderPath
  }, [selectedFolderPath])

  // Load folders on component mount and when initialFolder changes
  useEffect(() => {
    loadFolders()
  }, [initialFolder])

  // Update selectedFolderPath when initialFolder changes
  useEffect(() => {
    if (initialFolder && initialFolder !== 'root') {
      console.log('🔧 Setting selectedFolderPath to:', initialFolder)
      setSelectedFolderPath(initialFolder)
    } else {
      console.log('🔧 Setting selectedFolderPath to empty (Home)')
      setSelectedFolderPath('')
    }
  }, [initialFolder])

  // Validate selectedFolderPath when screen comes into focus
  // This handles the case where a folder was renamed in BrowseScreen
  useFocusEffect(
    React.useCallback(() => {
      const validateSelectedFolderPath = async () => {
        // Only validate if we have a non-empty selectedFolderPath
        if (selectedFolderPath && selectedFolderPath !== '') {
          console.log('🔍 Validating selectedFolderPath:', selectedFolderPath)

          const pathExists = await doesFolderPathExist(selectedFolderPath)

          if (!pathExists) {
            console.log('⚠️ Selected folder path no longer exists, resetting to root:', selectedFolderPath)
            setSelectedFolderPath('')
          } else {
            console.log('✅ Selected folder path is valid:', selectedFolderPath)
          }
        }
      }

      validateSelectedFolderPath()
    }, [selectedFolderPath])
  )

  const loadFolders = async () => {
    setLoading(true)
    try {
      await fileSystemService.initialize()

      // Recursively load all folders to handle nested folder paths
      const folderData: Folder[] = []

      const loadFoldersRecursively = async (basePath: string, relativePath: string = '') => {
        const contents = await fileSystemService.getFolderContents(basePath)

        for (const item of contents) {
          if (item.type === 'folder') {
            try {
              // Use hierarchical counting to get total items in entire folder tree
              const hierarchicalCount = await getHierarchicalItemCount(item.path)

              const fullRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name

              // Generate unique ID based on full path to avoid conflicts with duplicate folder names
              const uniqueId = `folder-${fullRelativePath.replace(/\//g, '-')}`

              folderData.push({
                id: uniqueId,
                name: item.name,
                itemCount: hierarchicalCount, // Now represents total items in folder tree
                path: fullRelativePath, // Store the full relative path
              })

              // Recursively load subfolders
              await loadFoldersRecursively(item.path, fullRelativePath)
            } catch (error) {
              // If we can't read the folder, add it with 0 count
              const fullRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name

              // Generate unique ID based on full path to avoid conflicts with duplicate folder names
              const uniqueId = `folder-${fullRelativePath.replace(/\//g, '-')}`

              folderData.push({
                id: uniqueId,
                name: item.name,
                itemCount: 0,
                path: fullRelativePath,
              })
            }
          }
        }
      }

      await loadFoldersRecursively(getRecordingsDirectory())
      setFolders(folderData)

      // Initial folder selection is now handled in useEffect above
    } catch (error) {
      console.error('Failed to load folders:', error)
      Alert.alert('Error', 'Failed to load folders')
    } finally {
      setLoading(false)
    }
  }

  // Audio quality options (expo-audio only supports HIGH_QUALITY and LOW_QUALITY presets)
  const audioQualityOptions: DropdownOption[] = [
    { label: 'High Quality', value: 'high' },
    { label: 'Medium Quality', value: 'medium' }, // Maps to HIGH_QUALITY preset
    { label: 'Low Quality', value: 'low' },
  ]

  const handleStartRecording = async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'Audio service not initialized')
      return
    }

    // Check permissions first and request if needed
    if (!hasPermissions) {
      Alert.alert(
        'Microphone Permission Required',
        'This app needs access to your microphone to record audio. Please grant permission to continue.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Grant Permission',
            onPress: async () => {
              const granted = await requestPermissions()
              if (granted) {
                await startRecording()
              } else {
                Alert.alert(
                  'Permission Denied',
                  'Recording permission is required to use this feature. Please enable it in your device settings.'
                )
              }
            },
          },
        ]
      )
      return
    }

    try {
      await startRecording()
    } catch (err) {
      Alert.alert('Recording Error', 'Failed to start recording')
    }
  }

  const handleStopRecording = async () => {
    try {
      const uri = await stopRecording()
      if (uri) {
        await saveRecordingToFolder(uri)
        setRecordingUri(uri)
      }
    } catch (err) {
      console.error('Stop recording error:', err)
      Alert.alert('Recording Error', 'Failed to stop recording')
    }
  }

  const saveRecordingToFolder = async (recordingUri: string) => {
    try {
      // Check if source file exists
      const sourceInfo = await FileSystem.getInfoAsync(recordingUri)
      if (!sourceInfo.exists) {
        throw new Error(`Source recording file does not exist: ${recordingUri}`)
      }

      // Get the target folder path using selectedFolderPath for nested folders
      let targetFolderPath: string
      if (!selectedFolderPath || selectedFolderPath === '') {
        // Root directory case
        targetFolderPath = getRecordingsDirectory()
      } else {
        // Nested folder case - use the full selectedFolderPath to handle duplicate folder names correctly
        targetFolderPath = joinPath(getRecordingsDirectory(), selectedFolderPath)
      }

      // Ensure the target folder exists before scanning for existing files
      const folderInfo = await FileSystem.getInfoAsync(targetFolderPath)
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(targetFolderPath, { intermediates: true })
      }

      // Scan existing files in the target directory to generate intelligent name
      let existingFileNames: string[] = []
      try {
        existingFileNames = await FileSystem.readDirectoryAsync(targetFolderPath)
      } catch (readError) {
        console.warn('Could not read directory for intelligent naming, using fallback:', readError)
        existingFileNames = []
      }

      // Generate intelligent filename with gap-filling logic
      const fileName = generateRecordingFilename(existingFileNames)
      const targetFilePath = joinPath(targetFolderPath, fileName)

      console.log('🎵 saveRecordingToFolder:', {
        selectedFolderPath,
        targetFolderPath,
        targetFilePath,
        fileName,
      })

      // Try to copy the recording file to the selected folder
      try {
        await FileSystem.copyAsync({
          from: recordingUri,
          to: targetFilePath,
        })
        // Recording saved successfully - no dialog popup needed
      } catch (copyError) {
        // If copy fails, try moving the file instead
        await FileSystem.moveAsync({
          from: recordingUri,
          to: targetFilePath,
        })
        // Recording saved successfully - no dialog popup needed
      }
    } catch (error) {
      console.error('Failed to save recording:', error)
      Alert.alert('Save Error', `Failed to save recording to folder: ${error}`)
    }
  }

  const handleRecordPress = () => {
    if (status === 'idle' || status === 'stopped') {
      handleStartRecording()
    } else if (status === 'recording') {
      handlePauseRecording()
    } else if (status === 'paused') {
      handleResumeRecording()
    }
  }

  const handlePauseRecording = async () => {
    try {
      await pauseRecording()
    } catch (err) {
      Alert.alert('Recording Error', 'Failed to pause recording')
    }
  }

  const handleResumeRecording = async () => {
    try {
      await resumeRecording()
    } catch (err) {
      Alert.alert('Recording Error', 'Failed to resume recording')
    }
  }

  const handleDonePress = async () => {
    await handleStopRecording()
    // Reset the recording state to prepare for a new recording
    resetRecording()
  }

  const handleFolderSelect = (folderId: string) => {
    // Find the folder data and set the path directly
    const selectedFolderData = folders.find(f => f.id === folderId)
    if (selectedFolderData) {
      setSelectedFolderPath(selectedFolderData.path || selectedFolderData.name) // Use full path if available
    }
  }

  const handleFileNavigatorSelect = (folder: FileNavigatorFolder) => {
    // For nested folders, we need to handle the path properly
    const recordingsDir = getRecordingsDirectory()

    // Normalize both paths by removing trailing slashes for comparison
    const normalizedRecordingsDir = recordingsDir.replace(/\/+$/, '')
    const normalizedFolderPath = folder.path.replace(/\/+$/, '')

    console.log('🔍 handleFileNavigatorSelect:', {
      folderName: folder.name,
      folderPath: folder.path,
      recordingsDir,
      normalizedRecordingsDir,
      normalizedFolderPath,
    })

    // Check if we're at the root directory
    const isRootDirectory = normalizedFolderPath === normalizedRecordingsDir

    let relativePath = ''
    if (!isRootDirectory) {
      // For nested folders, calculate relative path
      relativePath = folder.path.replace(recordingsDir, '').replace(/^\/+|\/+$/g, '')
    }

    console.log('🔍 Path calculation:', {
      isRootDirectory,
      relativePath,
    })

    // Update the selected folder path directly
    if (isRootDirectory) {
      setSelectedFolderPath('') // Empty string represents root for FileManagerContext
    } else {
      setSelectedFolderPath(relativePath) // Use relative path for nested folders
    }

    setShowFileNavigator(false)

    // Don't call loadFolders() here - the folder list doesn't need to be refreshed just for selection
  }

  const handleAudioQualitySelect = (option: DropdownOption) => {
    setAudioQuality(option.value as AudioQuality)
  }

  const handleGoToFolder = () => {
    // Use the stored folder path to preserve nested folder navigation
    const folderPath = selectedFolderPath

    console.log('🔍 RecordScreen handleGoToFolder:', {
      selectedFolderPath,
      initialFolder,
      folderPath,
    })

    // Handle root directory case - empty string means root
    if (!folderPath || folderPath === '') {
      console.log('🔍 RecordScreen navigating to root directory')
      // Navigate to root using FileManagerContext
      fileManager.navigateToRoot()
      router.push('/(tabs)/browse')
      return
    }

    // Parse the folder path and navigate using FileManagerContext
    const pathSegments = folderPath.split('/').filter(segment => segment.length > 0)
    fileManager.navigateToPath(pathSegments)

    // Navigate to browse screen
    console.log('🔍 RecordScreen navigating to Browse with folderPath:', folderPath)
    router.push('/(tabs)/browse')
  }

  return (
    <Screen backgroundColor={theme.colors.background.primary}>
      <Container flex>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>New Recording</Text>
          <Icon name="settings-outline" size="lg" color="secondary" />
        </View>

        <Spacer size="xl" />

        {/* Status Badge */}
        <RecordingStatusBadge status={status} isInitialized={isInitialized} hasPermissions={hasPermissions} />

        <Spacer size="lg" />

        {/* Duration Display */}
        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>{formatDurationFromSeconds(duration)}</Text>
        </View>

        <Spacer size="lg" />

        {/* Sound Wave Visualization */}
        <SoundWave audioLevel={audioLevel} isActive={status === 'recording'} style={styles.soundWave} />

        <Spacer size="lg" />

        {/* Record Button */}
        <View style={styles.recordButtonContainer}>
          <RecordButton
            testID="record-button"
            isRecording={status === 'recording'}
            isPaused={status === 'paused'}
            onPress={handleRecordPress}
            disabled={!isInitialized}
          />
        </View>

        <Spacer size="sm" />
        <Text style={styles.tapToRecordText}>
          {status === 'recording' ? 'Tap to Pause' : status === 'paused' ? 'Tap to Resume' : 'Tap to Record'}
        </Text>

        {/* Done Button - Show when recording or paused */}
        {(status === 'recording' || status === 'paused') && (
          <>
            <Spacer size="lg" />
            <View style={styles.doneButtonContainer}>
              <Button
                title="Done"
                variant="primary"
                onPress={handleDonePress}
                style={styles.doneButton}
                icon="checkmark"
              />
            </View>
          </>
        )}

        <Spacer size="2xl" />

        {/* Folder Selector with Go To Button */}
        <View style={styles.folderSelectorContainer}>
          <FolderSelectorWithGoTo
            selectedFolderId={selectedFolderId}
            selectedFolderDisplayName={selectedFolderDisplayName}
            folders={folders}
            loading={loading}
            onSelectFolder={handleFolderSelect}
            onOpenFileNavigator={() => setShowFileNavigator(true)}
            onGoToFolder={handleGoToFolder}
          />
        </View>

        <Spacer size="lg" />

        {/* Audio Quality Dropdown */}
        <Dropdown
          label="Audio Quality:"
          value={audioQuality}
          options={audioQualityOptions}
          onSelect={handleAudioQualitySelect}
        />

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Recording Info */}
        {recordingUri && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Last recording saved successfully!</Text>
          </View>
        )}
      </Container>

      {/* File Navigator Modal */}
      <FileNavigatorModal
        visible={showFileNavigator}
        onClose={() => setShowFileNavigator(false)}
        onSelectFolder={handleFileNavigatorSelect}
        initialDirectory={getAbsolutePath(selectedFolderPath)}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },

  dottedLine: {
    height: 2,
    width: '80%',
    alignSelf: 'center',
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: '#FF8C00', // Orange color from mockup
  },
  durationContainer: {
    alignItems: 'center',
    width: '100%',
  },
  durationText: {
    fontSize: 48,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  recordButtonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  tapToRecordText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  soundWave: {
    alignSelf: 'center',
    width: '80%',
  },
  doneButtonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  doneButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  recordingText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  bottomSection: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  savingToText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: theme.colors.error,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.white,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.sm,
  },
  infoContainer: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
  },
  infoText: {
    color: theme.colors.white,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.sm,
  },
  folderSelectorContainer: {
    width: '100%',
  },
})
