import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system'

import { theme } from '../utils/theme'
import { Button } from './Button'
import { Breadcrumbs } from './Breadcrumbs'

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
  initialDirectory?: string
  title?: string
  primaryButtonText?: string
  primaryButtonIcon?: keyof typeof Ionicons.glyphMap
  onPrimaryAction?: (currentPath: string) => void
  disablePrimaryButton?: boolean
  excludePath?: string // Path to exclude from navigation (e.g., the folder being moved)
  excludePaths?: string[] // Multiple paths to exclude from navigation (for multi-select)
}

/**
 * FileNavigatorModal for browsing and creating folders
 * Matches the design from the mockup screenshots
 */
export const FileNavigatorModal = React.memo(function FileNavigatorModal({
  visible,
  onClose,
  onSelectFolder,
  initialDirectory,
  title = 'Select Folder',
  primaryButtonText = 'Select',
  primaryButtonIcon,
  onPrimaryAction,
  disablePrimaryButton = false,
  excludePath,
  excludePaths,
}: FileNavigatorModalProps) {
  const [folders, setFolders] = useState<FileNavigatorFolder[]>([])
  const [showLoading, setShowLoading] = useState(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Memoize the recordings directory function
  const getRecordingsDirectory = useMemo(() => {
    const documentsDirectory = FileSystem.documentDirectory
    if (!documentsDirectory) return ''
    return `${documentsDirectory}recordings`
  }, [])

  const [currentFolderPath, setCurrentFolderPath] = useState(initialDirectory || getRecordingsDirectory)

  // Update currentFolderPath when initialDirectory changes
  useEffect(() => {
    if (initialDirectory && initialDirectory !== currentFolderPath) {
      setCurrentFolderPath(initialDirectory)
    }
  }, [initialDirectory]) // Remove currentFolderPath to avoid circular dependency

  const loadFolderContents = useCallback(async () => {
    // Set up delayed loading indicator
    // @ts-ignore
    loadingTimeoutRef.current = setTimeout(() => {
      setShowLoading(true)
    }, 250) // 250ms delay before showing loading indicator

    try {
      // Ensure the directory exists
      const dirInfo = await FileSystem.getInfoAsync(currentFolderPath)
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(currentFolderPath, { intermediates: true })
      }

      // Read directory contents
      const items = await FileSystem.readDirectoryAsync(currentFolderPath)

      const folderItems: FileNavigatorFolder[] = []

      for (const item of items) {
        const itemPath = `${currentFolderPath}/${item}`
        const itemInfo = await FileSystem.getInfoAsync(itemPath)

        if (itemInfo.isDirectory) {
          // Skip recently-deleted folder from move/restore destination options
          if (item === 'recently-deleted') {
            continue
          }

          // Check if this folder should be marked as being moved
          const allExcludePaths = excludePaths || (excludePath ? [excludePath] : [])
          const isBeingMoved = allExcludePaths.includes(itemPath)

          folderItems.push({
            id: `folder-${item}`,
            name: item,
            path: itemPath,
            isBeingMoved,
          })
        }
      }

      // Sort folders alphabetically
      folderItems.sort((a, b) => a.name.localeCompare(b.name))
      setFolders(folderItems)
    } catch (error) {
      console.error('Failed to load folder contents:', error)
      Alert.alert('Error', 'Failed to load folders')
    } finally {
      // Clear the loading timeout if it hasn't fired yet
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      setShowLoading(false)
    }
  }, [currentFolderPath, excludePath, excludePaths])

  // Load folder contents when component mounts or path changes
  useEffect(() => {
    if (visible) {
      loadFolderContents()
    }
  }, [visible, loadFolderContents])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
  }, [])

  const handleConfirmSelection = useCallback(() => {
    if (onPrimaryAction) {
      // Use custom primary action (e.g., "Move Here")
      onPrimaryAction(currentFolderPath)
      onClose()
    } else {
      // Default behavior - select the current directory being viewed
      const recordingsDir = getRecordingsDirectory
      const currentFolderName =
        currentFolderPath === recordingsDir ? 'Home' : currentFolderPath.split('/').pop() || 'Home'

      const currentFolder: FileNavigatorFolder = {
        id: `folder-${currentFolderName}`,
        name: currentFolderName,
        path: currentFolderPath,
        isBeingMoved: false,
      }

      onSelectFolder(currentFolder)
      onClose()
    }
  }, [onPrimaryAction, currentFolderPath, onClose, getRecordingsDirectory, onSelectFolder])

  // Check if the current directory is invalid for move operations
  const isCurrentDirectoryInvalid = useMemo(() => {
    const allExcludePaths = excludePaths || (excludePath ? [excludePath] : [])
    return allExcludePaths.some(path => currentFolderPath === path || currentFolderPath.startsWith(path + '/'))
  }, [excludePath, excludePaths, currentFolderPath])

  const handleNewFolder = useCallback(() => {
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
                const newFolderPath = `${currentFolderPath}/${folderName.trim()}`
                await FileSystem.makeDirectoryAsync(newFolderPath)
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
  }, [currentFolderPath, loadFolderContents])

  const handleBreadcrumbPress = useCallback((path: string, _index: number) => {
    setCurrentFolderPath(path)
  }, [])

  const handleFolderDoublePress = useCallback((folder: FileNavigatorFolder) => {
    // Navigate into the folder
    setCurrentFolderPath(folder.path)
  }, [])

  const renderFolder = useCallback(
    ({ item }: { item: FileNavigatorFolder }) => {
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
    },
    [handleFolderDoublePress]
  )

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

          {showLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading folders...</Text>
            </View>
          ) : folders.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name="folder-open-outline"
                size={48}
                color={theme.colors.text.tertiary}
                style={styles.emptyStateIcon}
              />
              <Text style={styles.emptyStateText}>This folder is empty</Text>
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

          <View style={styles.pathContainer}>
            <Breadcrumbs
              variant="compact"
              showHomeIcon={true}
              directoryPath={currentFolderPath}
              onBreadcrumbPress={handleBreadcrumbPress}
            />
          </View>

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
              disabled={disablePrimaryButton || isCurrentDirectoryInvalid}
              icon={primaryButtonIcon}
              style={styles.selectButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
})

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

  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },

  emptyStateIcon: {
    marginBottom: theme.spacing.md,
  },

  emptyStateText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
})
