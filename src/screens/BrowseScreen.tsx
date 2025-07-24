import React, { useState } from 'react'
import { StyleSheet, Text, View, Alert } from 'react-native'

import { Screen, Container, Spacer } from '@components/Layout'
import { FileCard, MediaCard } from '@components/Card'
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
    <FileCard
      title={item.name}
      subtitle={`${formatDuration(item.duration)} • ${formatFileSize(item.size)}`}
      icon="musical-note"
      onPress={() => handlePlayRecording(item)}
    />
  )

  // Mock data for Quick Access categories
  const quickAccessCategories = [
    { id: '1', title: 'Song Ideas', itemCount: 15, icon: 'folder-outline' as const },
    { id: '2', title: 'Voice Memos', itemCount: 12, icon: 'mic-outline' as const },
    { id: '3', title: 'Demos', itemCount: 8, icon: 'musical-notes-outline' as const },
    { id: '4', title: 'Lyrics', itemCount: 5, icon: 'document-text-outline' as const },
  ]

  return (
    <Screen backgroundColor={theme.colors.background.primary} scrollable>
      <Container padding>
        {/* Quick Access Section */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <Spacer size="md" />

        {quickAccessCategories.map(category => (
          <FileCard
            key={category.id}
            title={category.title}
            itemCount={category.itemCount}
            icon={category.icon}
            onPress={() => Alert.alert('Open Category', `Opening ${category.title}`)}
          />
        ))}

        <Spacer size="xl" />

        {/* Recent Recordings Section */}
        <Text style={styles.sectionTitle}>Recent Recordings</Text>
        <Spacer size="md" />

        {recordings.length > 0 ? (
          recordings.map(item => <View key={item.id}>{renderRecordingItem({ item })}</View>)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Recordings Yet</Text>
            <Text style={styles.emptyStateText}>Start recording to see your audio files here</Text>
          </View>
        )}

        <Spacer size="xl" />

        {/* Media Player (if playing) */}
        <MediaCard
          title="Guitar Riff Idea"
          artist="Song Ideas"
          duration="0:45"
          onPlayPause={() => Alert.alert('Play/Pause')}
          onNext={() => Alert.alert('Next')}
          onPrevious={() => Alert.alert('Previous')}
          onMore={() => Alert.alert('More options')}
          isPlaying={false}
        />
      </Container>
    </Screen>
  )
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed,
  },
})
