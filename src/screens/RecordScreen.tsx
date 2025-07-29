import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'

import { Screen, Container, Spacer } from '@components/Layout'
import { RecordButton, Icon } from '@components/Icon'
import { FolderSelector, Dropdown, FileNavigatorModal, Button, SoundWave } from '@components/index'
import type { Folder, FileNavigatorFolder, DropdownOption } from '@components/index'
import { useAudioRecording, type AudioQuality } from '@hooks/useAudioRecording'
import { theme } from '@utils/theme'
import { formatDurationFromSeconds } from '@utils/formatUtils'
import { fileSystemService } from '@services/FileSystemService'
import { getRecordingsDirectory, joinPath } from '@utils/pathUtils'
import * as FileSystem from 'expo-file-system'

/**
 * RecordScreen Component
 * Main screen for audio recording functionality
 */
export default function RecordScreen() {
  const router = useRouter()
  const { initialFolder } = useLocalSearchParams<{ initialFolder?: string }>()

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

  // State for folder selection - store both ID and name for stability
  const [selectedFolder, setSelectedFolder] = useState('song-ideas')
  const [selectedFolderName, setSelectedFolderName] = useState('Song Ideas') // Store the actual folder name
  const [showFileNavigator, setShowFileNavigator] = useState(false)
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)

  // Load folders on component mount and when initialFolder changes
  useEffect(() => {
    loadFolders()
  }, [initialFolder])

  const loadFolders = async () => {
    setLoading(true)
    try {
      await fileSystemService.initialize()
      const contents = await fileSystemService.getFolderContents(getRecordingsDirectory())

      // Convert to Folder format and count items in each folder
      const folderData: Folder[] = []
      for (const item of contents) {
        if (item.type === 'folder') {
          try {
            const folderContents = await fileSystemService.getFolderContents(item.path)
            const fileCount = folderContents.filter(subItem => subItem.type === 'file').length

            folderData.push({
              id: item.id,
              name: item.name,
              itemCount: fileCount,
            })
          } catch (error) {
            // If we can't read the folder, add it with 0 count
            folderData.push({
              id: item.id,
              name: item.name,
              itemCount: 0,
            })
          }
        }
      }

      setFolders(folderData)

      // Set initial folder selection based on navigation parameter
      if (initialFolder && initialFolder !== 'root') {
        // Handle nested folder paths (e.g., "folder1/folder2")
        const targetFolderName = initialFolder.split('/').pop() // Get the last folder name
        const targetFolder = folderData.find(folder => folder.name === targetFolderName)
        if (targetFolder) {
          setSelectedFolder(targetFolder.id)
          setSelectedFolderName(targetFolder.name)
        } else if (folderData.length > 0) {
          // Fallback to first folder if target not found
          setSelectedFolder(folderData[0].id)
          setSelectedFolderName(folderData[0].name)
        }
      } else if (folderData.length > 0) {
        // Try to maintain the same folder selection by name (more stable than ID)
        const currentFolderByName = folderData.find(folder => folder.name === selectedFolderName)
        if (currentFolderByName) {
          // Update the ID to match the current folder data, keep the same name
          setSelectedFolder(currentFolderByName.id)
        } else {
          // If the previously selected folder name doesn't exist, fallback to first folder
          setSelectedFolder(folderData[0].id)
          setSelectedFolderName(folderData[0].name)
        }
      }
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

      // Generate a unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `Recording_${timestamp}.m4a`

      // Get the target folder path
      const selectedFolderData = folders.find(f => f.id === selectedFolder)
      const folderName = selectedFolderData?.name || 'song-ideas'
      const targetFolderPath = joinPath(getRecordingsDirectory(), folderName)
      const targetFilePath = joinPath(targetFolderPath, fileName)

      console.log('Target folder path:', targetFolderPath)
      console.log('Target file path:', targetFilePath)

      // Ensure the target folder exists
      const folderInfo = await FileSystem.getInfoAsync(targetFolderPath)
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(targetFolderPath, { intermediates: true })
      }

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
    setSelectedFolder(folderId)
    // Also update the folder name for consistency
    const selectedFolderData = folders.find(f => f.id === folderId)
    if (selectedFolderData) {
      setSelectedFolderName(selectedFolderData.name)
    }
  }

  const handleFileNavigatorSelect = (folder: FileNavigatorFolder) => {
    // Update the selected folder and refresh the folder list
    setSelectedFolder(folder.id)
    setSelectedFolderName(folder.name) // Also update the folder name
    setShowFileNavigator(false)
    loadFolders() // Refresh the folder list to include any new folders
    // Folder selected successfully - no dialog popup needed
  }

  const handleAudioQualitySelect = (option: DropdownOption) => {
    setAudioQuality(option.value as AudioQuality)
  }

  const handleGoToFolder = () => {
    // Use the stored folder name directly instead of looking up by ID
    // This is more reliable since folder IDs can change between loads
    const folderName = selectedFolderName

    if (!folderName) {
      console.warn('No folder name available for navigation')
      // Fallback to root if no folder name is available
      router.push({
        pathname: '/(tabs)/browse',
        params: { initialFolder: 'root' },
      })
      return
    }

    // Navigate to browse screen with the selected folder
    router.push({
      pathname: '/(tabs)/browse',
      params: { initialFolder: folderName },
    })
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
        <View style={styles.statusBadgeContainer}>
          <View style={[styles.statusBadge, status === 'paused' && styles.statusBadgePaused]}>
            <Text style={styles.statusBadgeText}>
              {!isInitialized
                ? 'Initializing...'
                : !hasPermissions
                  ? 'Microphone Permission Required'
                  : status === 'recording'
                    ? 'Recording'
                    : status === 'paused'
                      ? 'Paused'
                      : 'Ready to Record'}
            </Text>
          </View>
        </View>

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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading folders...</Text>
          </View>
        ) : (
          <View style={styles.folderSelectorContainer}>
            <View style={styles.folderSelectorWrapper}>
              <FolderSelector
                label="Saving to:"
                selectedFolder={selectedFolder}
                folders={folders}
                onSelectFolder={handleFolderSelect}
                onOpenFileNavigator={() => setShowFileNavigator(true)}
              />
            </View>
            <TouchableOpacity style={styles.goToButton} onPress={handleGoToFolder} activeOpacity={0.7}>
              <Text style={styles.goToButtonIcon}>↪</Text>
              <Text style={styles.goToButtonText}>Go to</Text>
            </TouchableOpacity>
          </View>
        )}

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
  statusBadgeContainer: {
    alignItems: 'center',
    width: '100%',
  },
  statusBadge: {
    backgroundColor: theme.colors.surface.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  statusBadgePaused: {
    backgroundColor: theme.colors.secondary,
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  folderSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  folderSelectorWrapper: {
    flex: 1,
  },
  goToButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 48, // Match the FolderSelector height
  },
  goToButtonIcon: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  goToButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
})
