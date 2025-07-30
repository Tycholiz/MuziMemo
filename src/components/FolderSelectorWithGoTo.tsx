import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Icon } from '../components/Icon'

import { FolderSelector } from './FolderSelector'
import type { Folder } from './FolderSelector'
import { theme } from '@utils/theme'

export type FolderSelectorWithGoToProps = {
  selectedFolderId: string
  selectedFolderDisplayName: string
  folders: Folder[]
  loading?: boolean
  onSelectFolder: (folderId: string) => void
  onOpenFileNavigator: () => void
  onGoToFolder: () => void
  style?: any
}

/**
 * FolderSelectorWithGoTo Component
 * Combines folder selection with a "Go To" button for navigation
 */
export function FolderSelectorWithGoTo({
  selectedFolderId,
  selectedFolderDisplayName,
  folders,
  loading = false,
  onSelectFolder,
  onOpenFileNavigator,
  onGoToFolder,
  style,
}: FolderSelectorWithGoToProps) {
  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading folders...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.folderSelectorWrapper}>
        <FolderSelector
          label="Saving to:"
          selectedFolder={selectedFolderId}
          selectedFolderName={selectedFolderDisplayName}
          folders={folders}
          onSelectFolder={onSelectFolder}
          onOpenFileNavigator={onOpenFileNavigator}
        />
      </View>
      <TouchableOpacity style={styles.goToButton} onPress={onGoToFolder} activeOpacity={0.7}>
        <Icon name="arrow-forward-circle-outline" size="lg" color="secondary" />
        <Text style={styles.goToButtonText}>Go to</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  folderSelectorWrapper: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  goToButton: {
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  goToButtonIcon: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  goToButtonText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
})

// Note: The container needs flexDirection: 'row' from parent component
