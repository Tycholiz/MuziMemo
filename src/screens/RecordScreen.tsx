import React, { useState } from 'react'
import { StyleSheet, Text, View, Alert } from 'react-native'

import { Screen, Container, Spacer } from '@components/Layout'
import { RecordButton, Icon } from '@components/Icon'
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

  const handleRecordPress = () => {
    if (status === 'idle' || status === 'stopped') {
      handleStartRecording()
    } else if (status === 'recording') {
      handleStopRecording()
    }
  }

  return (
    <Screen backgroundColor={theme.colors.background.primary}>
      <Container flex centered>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>MuziMemo</Text>
          <Icon name="settings-outline" size="lg" color="secondary" />
        </View>

        <Spacer size="xl" />

        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>Ready to Record</Text>
        </View>

        <Spacer size="2xl" />

        {/* Duration Display */}
        <Text style={styles.durationText}>{formatDuration(duration)}</Text>

        <Spacer size="lg" />

        {/* Record Button */}
        <RecordButton isRecording={status === 'recording'} onPress={handleRecordPress} disabled={!isInitialized} />

        <Spacer size="sm" />
        <Text style={styles.tapToRecordText}>Tap to Record</Text>

        <Spacer size="2xl" />

        {/* Status Indicator */}
        {status === 'recording' && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC</Text>
          </View>
        )}

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <Text style={styles.savingToText}>Saving to: Song Ideas</Text>
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
      </Container>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  statusBadge: {
    backgroundColor: theme.colors.surface.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  durationText: {
    fontSize: 48,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  tapToRecordText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
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
})
