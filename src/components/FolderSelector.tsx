import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'
import { Button } from './Button'
import { doesFolderPathExist } from '@utils/pathUtils'

// Maximum number of commonly used folders to display
const MAX_COMMONLY_USED_FOLDERS = 6

export type Folder = {
  id: string
  name: string
  itemCount: number
  path?: string // Full relative path from recordings directory (e.g., "hello/Song Ideas")
}

export type FolderSelectorProps = {
  label?: string
  selectedFolder: string
  selectedFolderName?: string // Optional override for display name
  folders: Folder[]
  onSelectFolder: (folderId: string) => void
  onOpenFileNavigator: () => void
  disabled?: boolean
}

/**
 * Save Destination Folder selector component that shows commonly used folders
 * and provides access to file navigator to determine where the recording should be saved
 */
export function FolderSelector({
  label,
  selectedFolder,
  selectedFolderName,
  folders,
  onSelectFolder,
  onOpenFileNavigator,
  disabled = false,
}: FolderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [validatedFolders, setValidatedFolders] = useState<Folder[]>([])
  const [isValidating, setIsValidating] = useState(false)

  // Memoize the validation function to prevent infinite re-renders
  const validateAndRankFolders = useCallback(async () => {
    setIsValidating(true)
    try {
      const validFolders: Folder[] = []

      // Validate each folder's existence (exclude recently-deleted)
      for (const folder of folders) {
        try {
          // Skip recently-deleted folder from commonly used folders
          if (folder.name === 'recently-deleted' || folder.path === 'recently-deleted') {
            continue
          }

          const exists = await doesFolderPathExist(folder.path || '')
          if (exists) {
            validFolders.push(folder)
          } else {
            console.log(`Folder no longer exists: ${folder.path || folder.name}`)
          }
        } catch (error) {
          console.error(`Error validating folder ${folder.name}:`, error)
          // On error, exclude the folder to be safe
        }
      }

      // Sort by hierarchical item count (descending) and limit to top 6
      const rankedFolders = validFolders.sort((a, b) => b.itemCount - a.itemCount).slice(0, MAX_COMMONLY_USED_FOLDERS)

      setValidatedFolders(rankedFolders)
    } catch (error) {
      console.error('Error validating and ranking folders:', error)
      // Fallback to original folders if validation fails
      setValidatedFolders(folders.slice(0, MAX_COMMONLY_USED_FOLDERS))
    } finally {
      setIsValidating(false)
    }
  }, [folders])

  // Validate folder existence and apply intelligent ranking when modal opens
  useEffect(() => {
    if (isOpen) {
      validateAndRankFolders()
    }
  }, [isOpen, validateAndRankFolders])

  const selectedFolderData = useMemo(
    () => folders.find(folder => folder.id === selectedFolder),
    [folders, selectedFolder]
  )
  const displayName = selectedFolderName || selectedFolderData?.name || 'Home'
  const displayPath = selectedFolderData?.path || displayName

  // Format selector display with house icon and "/" separators
  const formatSelectorDisplay = useCallback((path: string) => {
    if (!path || path === 'Home') {
      return (
        <View style={styles.selectorPathDisplay}>
          <Ionicons name="home" size={20} color={theme.colors.text.secondary} testID="home-icon" />
        </View>
      )
    }

    const segments = path.split('/').filter(Boolean)
    const pathElements = []

    // Always start with house icon
    pathElements.push(
      <Ionicons key="home" name="home" size={20} color={theme.colors.text.secondary} testID="home-icon" />
    )

    // Add separator and segments
    segments.forEach((segment, index) => {
      pathElements.push(
        <Ionicons
          key={`separator-${index}`}
          name="chevron-forward"
          size={14}
          color={theme.colors.text.secondary}
          style={styles.separator}
        />
      )
      pathElements.push(
        <Text key={`segment-${index}`} style={styles.selectorPathSegment}>
          {segment}
        </Text>
      )
    })

    return <View style={styles.selectorPathDisplay}>{pathElements}</View>
  }, [])

  const handleSelectFolder = useCallback(
    (folderId: string) => {
      onSelectFolder(folderId)
      setIsOpen(false)
    },
    [onSelectFolder]
  )

  const handleFileNavigator = useCallback(() => {
    setIsOpen(false)
    onOpenFileNavigator()
  }, [onOpenFileNavigator])

  // Memoize the path formatting function for folder items
  const formatPathDisplay = useCallback((path: string) => {
    if (!path || path === 'Home') {
      return (
        <View style={styles.pathDisplay}>
          <Ionicons name="home" size={14} color={theme.colors.primary} testID="home-icon" />
        </View>
      )
    }

    const segments = path.split('/').filter(Boolean)
    const pathElements = []

    // Always start with house icon
    pathElements.push(<Ionicons key="home" name="home" size={16} color={theme.colors.primary} testID="home-icon" />)

    // Add separator and segments
    segments.forEach((segment, index) => {
      pathElements.push(
        <Ionicons
          key={`separator-${index}`}
          name="chevron-forward"
          size={16}
          color={theme.colors.text.secondary}
          style={styles.separator}
        />
      )
      pathElements.push(
        <Text key={`segment-${index}`} style={styles.pathSegment}>
          {segment}
        </Text>
      )
    })

    return <View style={styles.pathDisplay}>{pathElements}</View>
  }, [])

  const renderFolder = useCallback(
    ({ item }: { item: Folder }) => {
      // Show full path for nested folders to help distinguish between folders with same names
      const displayPath = item.path && item.path !== item.name ? item.path : item.name

      return (
        <TouchableOpacity style={styles.folderOption} onPress={() => handleSelectFolder(item.id)} activeOpacity={0.7}>
          <View style={styles.folderContent}>
            <View style={styles.folderText}>
              {formatPathDisplay(displayPath)}
              <Text style={styles.folderCount}>{item.itemCount} items</Text>
            </View>
          </View>
        </TouchableOpacity>
      )
    },
    [formatPathDisplay, handleSelectFolder]
  )

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.selector, disabled && styles.disabled]}
        onPress={() => !disabled && setIsOpen(true)}
        activeOpacity={0.7}
        testID="folder-selector"
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        <View style={styles.selectorContent}>{formatSelectorDisplay(displayPath)}</View>
        <Ionicons name="chevron-down" size={20} color={theme.colors.text.tertiary} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Commonly Used Folders</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {isValidating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Validating folders...</Text>
              </View>
            ) : (
              <FlatList
                data={validatedFolders}
                renderItem={renderFolder}
                keyExtractor={item => item.id}
                style={styles.foldersList}
                showsVerticalScrollIndicator={false}
              />
            )}

            <View style={styles.modalFooter}>
              <Button
                title="File Navigator"
                variant="outline"
                onPress={handleFileNavigator}
                icon="folder-open-outline"
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },

  label: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },

  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  disabled: {
    opacity: 0.5,
  },

  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: theme.colors.surface.primary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '70%',
    paddingBottom: theme.spacing.xl,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },

  closeButton: {
    padding: theme.spacing.xs,
  },

  foldersList: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },

  folderOption: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  folderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  folderText: {
    flex: 1,
  },

  folderName: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  folderCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },

  modalFooter: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },

  pathDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  pathSeparator: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginHorizontal: 4,
  },

  pathSegment: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  selectorPathDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },

  selectorPathSeparator: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginHorizontal: 4,
  },

  selectorPathSegment: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },

  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  separator: {
    marginHorizontal: 4,
  },
})
