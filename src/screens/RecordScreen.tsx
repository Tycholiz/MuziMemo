import React, { useState } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { SafeAreaWrapper } from '@components/SafeAreaWrapper'
import { useAudioRecording } from '@hooks/useAudioRecording'
import { theme } from '@utils/theme'
import { formatDuration } from '@utils/formatUtils'

/**
 * RecordScreen Component
 * Main screen for audio recording functionality
 */
export default function RecordScreen() {
  const { status, duration, isInitialized, error, startRecording, stopRecording } = useAudioRecording()
  const [recordingUri, setRecordingUri] = useState<string | null>(null)

  const handleStartRecording = async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'Audio service not initialized')
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
        setRecordingUri(uri)
        Alert.alert('Recording Complete', 'Your recording has been saved!')
      }
    } catch (err) {
      Alert.alert('Recording Error', 'Failed to stop recording')
    }
  }

  const getRecordButtonIcon = () => {
    switch (status) {
      case 'recording':
        return 'stop'
      case 'paused':
        return 'play'
      default:
        return 'mic'
    }
  }

  const getRecordButtonColor = () => {
    switch (status) {
      case 'recording':
        return theme.colors.error
      case 'paused':
        return theme.colors.warning
      default:
        return theme.colors.primary
    }
  }

  const handleRecordPress = () => {
    if (status === 'idle' || status === 'stopped') {
      handleStartRecording()
    } else if (status === 'recording') {
      handleStopRecording()
    }
  }

  return (
    <SafeAreaWrapper style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Record Audio</Text>
          <Text style={styles.subtitle}>Tap the microphone to start recording</Text>
        </View>

        <View style={styles.recordingArea}>
          {/* Duration Display */}
          <View style={styles.durationContainer}>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
            <Text style={styles.statusText}>
              {status === 'recording' ? 'Recording...' : status === 'paused' ? 'Paused' : 'Ready to record'}
            </Text>
          </View>

          {/* Record Button */}
          <TouchableOpacity
            style={[styles.recordButton, { backgroundColor: getRecordButtonColor() }]}
            onPress={handleRecordPress}
            disabled={!isInitialized}
          >
            <Ionicons name={getRecordButtonIcon()} size={48} color={theme.colors.white} />
          </TouchableOpacity>

          {/* Status Indicator */}
          {status === 'recording' && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>REC</Text>
            </View>
          )}
        </View>

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
      </View>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  recordingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  durationText: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    fontFamily: 'monospace',
  },
  statusText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.error,
    marginRight: theme.spacing.sm,
  },
  recordingText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.error,
  },
  errorContainer: {
    backgroundColor: theme.colors.error,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
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
  },
  infoText: {
    color: theme.colors.white,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.sm,
  },
})
