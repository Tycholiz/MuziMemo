import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'
import { Button } from './Button'
import { fileSystemService } from '@services/FileSystemService'
import { generateBreadcrumbs, getRecordingsDirectory } from '@utils/pathUtils'

export type FileNavigatorFolder = {
  id: string
  name: string
  path: string
}

export type FileNavigatorProps = {
  visible: boolean
  onClose: () => void
  onSelectFolder: (folder: FileNavigatorFolder) => void
  currentPath?: string
}

/**
 * File Navigator modal for browsing and creating folders
 * Matches the design from the mockup screenshots
 */
export function FileNavigator({ visible, onClose, onSelectFolder, currentPath }: FileNavigatorProps) {
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

      // Filter to only show folders
      const folderItems = contents
        .filter(item => item.type === 'folder')
        .map(item => ({
          id: item.id,
          name: item.name,
          path: item.path,
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

  const handleSelectFolder = (folder: FileNavigatorFolder) => {
    setSelectedFolder(folder.id)
  }

  const handleConfirmSelection = () => {
    const folder = folders.find(f => f.id === selectedFolder)
    if (folder) {
      onSelectFolder(folder)
      onClose()
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

  const handleBreadcrumbPress = (path: string) => {
    setCurrentFolderPath(path)
    setSelectedFolder(null)
  }

  const handleFolderDoublePress = (folder: FileNavigatorFolder) => {
    // Navigate into the folder
    setCurrentFolderPath(folder.path)
    setSelectedFolder(null)
  }

  const renderFolder = ({ item }: { item: FileNavigatorFolder }) => {
    let lastTap = 0

    const handlePress = () => {
      const now = Date.now()
      const DOUBLE_PRESS_DELAY = 300

      if (now - lastTap < DOUBLE_PRESS_DELAY) {
        // Double tap - navigate into folder
        handleFolderDoublePress(item)
      } else {
        // Single tap - select folder
        handleSelectFolder(item)
      }
      lastTap = now
    }

    return (
      <TouchableOpacity
        style={[styles.folderItem, selectedFolder === item.id && styles.selectedFolder]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons
          name="folder-outline"
          size={24}
          color={selectedFolder === item.id ? theme.colors.primary : theme.colors.primary}
          style={styles.folderIcon}
        />
        <Text style={[styles.folderName, selectedFolder === item.id && styles.selectedFolderName]}>{item.name}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Folder</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.pathContainer}>
            <View style={styles.breadcrumbs}>
              {breadcrumbs.map(crumb => (
                <View key={crumb.path} style={styles.breadcrumbContainer}>
                  <TouchableOpacity onPress={() => handleBreadcrumbPress(crumb.path)} style={styles.breadcrumbButton}>
                    <Text style={[styles.breadcrumbText, crumb.isLast && styles.breadcrumbTextLast]}>{crumb.name}</Text>
                  </TouchableOpacity>
                  {!crumb.isLast && (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.colors.text.tertiary}
                      style={styles.breadcrumbSeparator}
                    />
                  )}
                </View>
              ))}
            </View>
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
              title="Select"
              variant="primary"
              onPress={handleConfirmSelection}
              disabled={!selectedFolder}
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
    maxHeight: '70%',
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

  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  breadcrumbButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },

  breadcrumbText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  breadcrumbTextLast: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  breadcrumbSeparator: {
    marginHorizontal: theme.spacing.xs,
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
