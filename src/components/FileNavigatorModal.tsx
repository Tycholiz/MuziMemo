import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'
import { Button } from './Button'
import { Breadcrumbs } from './Breadcrumbs'
import { fileSystemService } from '@services/FileSystemService'
import { generateBreadcrumbs, getRecordingsDirectory } from '@utils/pathUtils'

export type FileNavigatorFolder = {
  id: string
  name: string
  path: string
  isBeingMoved?: boolean
}

export type FileNavigatorModalProps = {
  visible: boolean
  onClose: () => void
  onSelectFolder: (folder: FileNavigatorFolder) => void
  currentPath?: string
  title?: string
  primaryButtonText?: string
  primaryButtonIcon?: keyof typeof Ionicons.glyphMap
  onPrimaryAction?: (currentPath: string) => void
  disablePrimaryButton?: boolean
  excludePath?: string // Path to exclude from navigation (e.g., the folder being moved)
}

/**
 * FileNavigatorModal for browsing and creating folders
 * Matches the design from the mockup screenshots
 */
export function FileNavigatorModal({
  visible,
  onClose,
  onSelectFolder,
  currentPath,
  title = 'Select Folder',
  primaryButtonText = 'Select',
  primaryButtonIcon,
  onPrimaryAction,
  disablePrimaryButton = false,
  excludePath,
}: FileNavigatorModalProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [folders, setFolders] = useState<FileNavigatorFolder[]>([])
  const [loading, setLoading] = useState(false)
  const [currentFolderPath, setCurrentFolderPath] = useState(currentPath || getRecordingsDirectory())
  const [breadcrumbs, setBreadcrumbs] = useState(generateBreadcrumbs(currentFolderPath))

  // Load folder contents when component mounts or path changes
  useEffect(() => {
    if (visible) {
      loadFolderContents()
    }
  }, [visible, currentFolderPath])

  const loadFolderContents = async () => {
    setLoading(true)
    try {
      await fileSystemService.initialize()
      const contents = await fileSystemService.getFolderContents(currentFolderPath)

      // Filter to only show folders, but include the excluded folder for display purposes
      const folderItems = contents
        .filter(item => item.type === 'folder')
        .map(item => ({
          id: item.id,
          name: item.name,
          path: item.path,
          isBeingMoved: excludePath === item.path,
        }))

      setFolders(folderItems)
      setBreadcrumbs(generateBreadcrumbs(currentFolderPath))
    } catch (error) {
      console.error('Failed to load folder contents:', error)
      Alert.alert('Error', 'Failed to load folders')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSelection = () => {
    if (onPrimaryAction) {
      // Use custom primary action (e.g., "Move Here")
      onPrimaryAction(currentFolderPath)
      onClose()
    } else {
      // Default behavior - select a specific folder
      const folder = folders.find(f => f.id === selectedFolder)
      if (folder) {
        onSelectFolder(folder)
        onClose()
      }
    }
  }

  const handleNewFolder = () => {
    Alert.prompt(
      'New Folder',
      'Enter folder name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async folderName => {
            if (folderName?.trim()) {
              try {
                await fileSystemService.createFolder({
                  name: folderName.trim(),
                  parentPath: currentFolderPath,
                })
                Alert.alert('Success', `Folder "${folderName}" created successfully`)
                loadFolderContents() // Refresh the list
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to create folder')
              }
            }
          },
        },
      ],
      'plain-text'
    )
  }

  const handleBreadcrumbPress = (path: string, _index: number) => {
    setCurrentFolderPath(path)
    setSelectedFolder(null)
  }

  const handleFolderDoublePress = (folder: FileNavigatorFolder) => {
    // Navigate into the folder
    setCurrentFolderPath(folder.path)
    setSelectedFolder(null)
  }

  const renderFolder = ({ item }: { item: FileNavigatorFolder }) => {
    const handlePress = () => {
      if (item.isBeingMoved) {
        // Don't allow navigation into the folder being moved
        return
      }
      // Single tap - navigate into folder
      handleFolderDoublePress(item)
    }

    return (
      <TouchableOpacity
        style={[styles.folderItem, item.isBeingMoved && styles.folderBeingMoved]}
        onPress={handlePress}
        activeOpacity={item.isBeingMoved ? 1 : 0.7}
      >
        <Ionicons
          name="folder-outline"
          size={24}
          color={item.isBeingMoved ? theme.colors.text.tertiary : theme.colors.primary}
          style={styles.folderIcon}
        />
        <Text style={[styles.folderName, item.isBeingMoved && styles.folderBeingMovedText]}>
          {item.name}
          {item.isBeingMoved && ' (being moved)'}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.pathContainer}>
            <Breadcrumbs breadcrumbs={breadcrumbs} onBreadcrumbPress={handleBreadcrumbPress} variant="compact" />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading folders...</Text>
            </View>
          ) : (
            <FlatList
              data={folders}
              renderItem={renderFolder}
              keyExtractor={item => item.id}
              style={styles.foldersList}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={styles.footer}>
            <Button
              title="New Folder"
              variant="outline"
              onPress={handleNewFolder}
              icon="add"
              style={styles.newFolderButton}
            />

            <Button
              title={primaryButtonText}
              variant="primary"
              onPress={handleConfirmSelection}
              disabled={disablePrimaryButton || (!onPrimaryAction && !selectedFolder)}
              icon={primaryButtonIcon}
              style={styles.selectButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modal: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    width: '90%',
    maxWidth: 400,
    height: '70%',
    display: 'flex',
    flexDirection: 'column',
    ...theme.shadows.lg,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },

  closeButton: {
    padding: theme.spacing.xs,
  },

  pathContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface.secondary,
  },

  pathText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  foldersList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },

  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.xs,
  },

  selectedFolder: {
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },

  folderIcon: {
    marginRight: theme.spacing.md,
  },

  folderName: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  selectedFolderName: {
    color: theme.colors.primary,
  },

  folderBeingMoved: {
    backgroundColor: theme.colors.surface.secondary,
    opacity: 0.6,
  },

  folderBeingMovedText: {
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },

  footer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    gap: theme.spacing.md,
  },

  newFolderButton: {
    flex: 1,
  },

  selectButton: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },

  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
})
