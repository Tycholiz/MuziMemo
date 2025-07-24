import React, { useState } from 'react'
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { SafeAreaWrapper } from '@components/SafeAreaWrapper'
import { theme } from '@utils/theme'
import { formatDuration, formatDate, formatFileSize } from '@utils/formatUtils'
import type { Recording } from 'src/customTypes/Recording'

/**
 * BrowseScreen Component
 * Main screen for browsing and managing recorded audio files
 */
export default function BrowseScreen() {
  // Mock data for demonstration - in a real app, this would come from storage
  const [recordings] = useState<Recording[]>([
    {
      id: '1',
      name: 'Recording 1',
      duration: 45000, // 45 seconds
      filePath: '/path/to/recording1.m4a',
      createdAt: new Date('2024-01-15T10:30:00'),
      size: 1024000, // 1MB
      format: 'm4a',
    },
    {
      id: '2',
      name: 'Recording 2',
      duration: 120000, // 2 minutes
      filePath: '/path/to/recording2.m4a',
      createdAt: new Date('2024-01-14T15:45:00'),
      size: 2048000, // 2MB
      format: 'm4a',
    },
    {
      id: '3',
      name: 'Recording 3',
      duration: 30000, // 30 seconds
      filePath: '/path/to/recording3.m4a',
      createdAt: new Date('2024-01-13T09:15:00'),
      size: 512000, // 512KB
      format: 'm4a',
    },
  ])

  const handlePlayRecording = (recording: Recording) => {
    Alert.alert('Play Recording', `Playing: ${recording.name}`)
    // TODO: Implement audio playback
  }

  const handleDeleteRecording = (recording: Recording) => {
    Alert.alert('Delete Recording', `Are you sure you want to delete "${recording.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          // TODO: Implement deletion
          Alert.alert('Deleted', `"${recording.name}" has been deleted.`)
        },
      },
    ])
  }

  const handleShareRecording = (recording: Recording) => {
    Alert.alert('Share Recording', `Sharing: ${recording.name}`)
    // TODO: Implement sharing functionality
  }

  const renderRecordingItem = ({ item }: { item: Recording }) => (
    <View style={styles.recordingItem}>
      <View style={styles.recordingInfo}>
        <Text style={styles.recordingName}>{item.name}</Text>
        <Text style={styles.recordingDetails}>
          {formatDuration(item.duration)} • {formatFileSize(item.size)} • {formatDate(item.createdAt)}
        </Text>
      </View>

      <View style={styles.recordingActions}>
        <TouchableOpacity style={[styles.actionButton, styles.playButton]} onPress={() => handlePlayRecording(item)}>
          <Ionicons name="play" size={20} color={theme.colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={() => handleShareRecording(item)}>
          <Ionicons name="share" size={20} color={theme.colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteRecording(item)}
        >
          <Ionicons name="trash" size={20} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-open-outline" size={64} color={theme.colors.text.tertiary} />
      <Text style={styles.emptyStateTitle}>No Recordings Yet</Text>
      <Text style={styles.emptyStateText}>Start recording to see your audio files here</Text>
    </View>
  )

  return (
    <SafeAreaWrapper style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>My Recordings</Text>
          <Text style={styles.subtitle}>
            {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {recordings.length > 0 ? (
          <FlatList
            data={recordings}
            renderItem={renderRecordingItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          renderEmptyState()
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
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  listContainer: {
    paddingBottom: theme.spacing.lg,
  },
  recordingItem: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  recordingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  recordingName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  recordingDetails: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: theme.colors.primary,
  },
  shareButton: {
    backgroundColor: theme.colors.secondary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed,
  },
})
