import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'
import { Button } from './Button'

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

  const selectedFolderData = folders.find(folder => folder.id === selectedFolder)
  const displayName = selectedFolderName || selectedFolderData?.name || 'Home'

  const handleSelectFolder = (folderId: string) => {
    onSelectFolder(folderId)
    setIsOpen(false)
  }

  const handleFileNavigator = () => {
    setIsOpen(false)
    onOpenFileNavigator()
  }

  const renderFolder = ({ item }: { item: Folder }) => {
    // Show full path for nested folders to help distinguish between folders with same names
    const displayPath = item.path && item.path !== item.name ? item.path : item.name

    // TODO: replace Ionicons with custom Icon component
    return (
      <TouchableOpacity style={styles.folderOption} onPress={() => handleSelectFolder(item.id)} activeOpacity={0.7}>
        <View style={styles.folderContent}>
          <Ionicons name="folder-outline" size={20} color={theme.colors.primary} style={styles.folderIcon} />
          <View style={styles.folderText}>
            <Text style={styles.folderName}>{displayPath}</Text>
            <Text style={styles.folderCount}>{item.itemCount} items</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.selector, disabled && styles.disabled]}
        onPress={() => !disabled && setIsOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          <Ionicons name="folder-outline" size={20} color={theme.colors.text.secondary} style={styles.selectorIcon} />
          <Text style={styles.selectorText}>{displayName}</Text>
        </View>
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

            <FlatList
              data={folders}
              renderItem={renderFolder}
              keyExtractor={item => item.id}
              style={styles.foldersList}
              showsVerticalScrollIndicator={false}
            />

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

  selectorIcon: {
    marginRight: theme.spacing.sm,
  },

  selectorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
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

  folderIcon: {
    marginRight: theme.spacing.md,
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
})
