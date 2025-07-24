import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, Alert, TouchableOpacity, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '@components/Layout'
import { MediaCard } from '@components/Card'
import { theme } from '@utils/theme'

type FolderCardData = {
  id: string
  name: string
  itemCount: number
}

type ClipData = {
  id: string
  name: string
  folder: string
  duration: string
  date: string
}

/**
 * BrowseScreen Component
 * Main screen for browsing and managing recorded audio files
 */
export default function BrowseScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPath, setCurrentPath] = useState('Song Ideas')
  const [folders, setFolders] = useState<FolderCardData[]>([])
  const [clips, setClips] = useState<ClipData[]>([])
  // Mock data for folders
  const mockFolders: FolderCardData[] = [
    { id: '1', name: 'Song Ideas', itemCount: 12 },
    { id: '2', name: 'Demos', itemCount: 8 },
    { id: '3', name: 'Voice Memos', itemCount: 15 },
    { id: '4', name: 'Lyrics', itemCount: 5 },
  ]

  // Mock data for clips
  const mockClips: ClipData[] = [
    { id: '1', name: 'Guitar Riff Idea', folder: 'Song Ideas', duration: '0:45', date: 'Today' },
    { id: '2', name: 'Vocal Melody Hook', folder: 'Song Ideas', duration: '1:23', date: 'Yesterday' },
    { id: '3', name: 'Chord Progression', folder: 'Song Ideas', duration: '2:10', date: '2 days ago' },
    { id: '4', name: 'Bass Line Test', folder: 'Song Ideas', duration: '0:38', date: '3 days ago' },
  ]

  useEffect(() => {
    // Initialize with mock data
    setFolders(mockFolders)
    setClips(mockClips)
  }, [])

  const handleFolderPress = (folder: FolderCardData) => {
    setCurrentPath(folder.name)
    Alert.alert('Open Folder', `Opening ${folder.name}`)
  }

  const handleClipPress = (clip: ClipData) => {
    Alert.alert('Play Clip', `Playing: ${clip.name}`)
  }

  const handleNewFolder = () => {
    Alert.alert('New Folder', 'Create new folder functionality')
  }

  const handleImport = () => {
    Alert.alert('Import', 'Import functionality')
  }

  const renderFolderCard = (folder: FolderCardData) => (
    <TouchableOpacity
      key={folder.id}
      style={styles.folderCard}
      onPress={() => handleFolderPress(folder)}
      activeOpacity={0.7}
    >
      <View style={styles.folderIconContainer}>
        <Ionicons name="folder" size={32} color="#FF6B6B" />
      </View>
      <Text style={styles.folderName}>{folder.name}</Text>
      <Text style={styles.folderItemCount}>{folder.itemCount} items</Text>
    </TouchableOpacity>
  )

  const renderClipItem = (clip: ClipData) => (
    <TouchableOpacity key={clip.id} style={styles.clipItem} onPress={() => handleClipPress(clip)} activeOpacity={0.7}>
      <View style={styles.clipInfo}>
        <Text style={styles.clipName}>{clip.name}</Text>
        <Text style={styles.clipDetails}>
          {clip.date} • {clip.duration}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <Screen backgroundColor={theme.colors.background.primary}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Browse</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Ionicons
                name={viewMode === 'grid' ? 'grid-outline' : 'list-outline'}
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="menu-outline" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={theme.colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clips, folders..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Breadcrumb */}
        <View style={styles.breadcrumbContainer}>
          <TouchableOpacity style={styles.breadcrumbItem}>
            <Ionicons name="home-outline" size={16} color={theme.colors.text.secondary} />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
          <Text style={styles.breadcrumbText}>{currentPath}</Text>
        </View>

        {/* Folders Grid */}
        <View style={styles.foldersContainer}>
          <View style={styles.foldersGrid}>{folders.map(renderFolderCard)}</View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleNewFolder}>
            <Ionicons name="add" size={20} color={theme.colors.text.primary} />
            <Text style={styles.actionButtonText}>New Folder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleImport}>
            <Text style={styles.actionButtonText}>Import</Text>
          </TouchableOpacity>
        </View>

        {/* Clips Section */}
        <View style={styles.clipsSection}>
          <Text style={styles.clipsTitle}>{clips.length} clips</Text>
          <View style={styles.clipsList}>{clips.map(renderClipItem)}</View>
        </View>

        {/* Bottom Media Player */}
        <View style={styles.mediaPlayerContainer}>
          <MediaCard
            title="Guitar Riff Idea"
            artist="Song Ideas • 0:45"
            duration="0:45"
            onPlayPause={() => Alert.alert('Play/Pause')}
            onNext={() => Alert.alert('Next')}
            onPrevious={() => Alert.alert('Previous')}
            onMore={() => Alert.alert('More options')}
            isPlaying={false}
          />
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  headerButton: {
    padding: theme.spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  breadcrumbItem: {
    padding: theme.spacing.xs,
  },
  breadcrumbText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  foldersContainer: {
    marginBottom: theme.spacing.xl,
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  folderCard: {
    width: '45%',
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  folderIconContainer: {
    marginBottom: theme.spacing.md,
  },
  folderName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  folderItemCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  clipsSection: {
    flex: 1,
    marginBottom: theme.spacing.xl,
  },
  clipsTitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.lg,
  },
  clipsList: {
    gap: theme.spacing.md,
  },
  clipItem: {
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  clipInfo: {
    flex: 1,
  },
  clipName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  clipDetails: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  mediaPlayerContainer: {
    paddingBottom: theme.spacing.lg,
  },
})
