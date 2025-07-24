import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'
import { Button } from './Button'

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
export function FileNavigator({
  visible,
  onClose,
  onSelectFolder,
  currentPath = 'Root',
}: FileNavigatorProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  // Mock folder data - in real app this would come from file system
  const folders: FileNavigatorFolder[] = [
    { id: 'song-ideas', name: 'Song Ideas', path: '/Song Ideas' },
    { id: 'demos', name: 'Demos', path: '/Demos' },
    { id: 'voice-memos', name: 'Voice Memos', path: '/Voice Memos' },
  ]

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
          onPress: (folderName) => {
            if (folderName?.trim()) {
              Alert.alert('Success', `Created folder: ${folderName}`)
              // In real app, would create the folder and refresh the list
            }
          },
        },
      ],
      'plain-text'
    )
  }

  const renderFolder = ({ item }: { item: FileNavigatorFolder }) => (
    <TouchableOpacity
      style={[
        styles.folderItem,
        selectedFolder === item.id && styles.selectedFolder,
      ]}
      onPress={() => handleSelectFolder(item)}
      activeOpacity={0.7}
    >
      <Ionicons
        name="folder-outline"
        size={24}
        color={selectedFolder === item.id ? theme.colors.primary : theme.colors.primary}
        style={styles.folderIcon}
      />
      <Text
        style={[
          styles.folderName,
          selectedFolder === item.id && styles.selectedFolderName,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Folder</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.pathContainer}>
            <Text style={styles.pathText}>{currentPath}</Text>
          </View>

          <FlatList
            data={folders}
            renderItem={renderFolder}
            keyExtractor={item => item.id}
            style={styles.foldersList}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <Button
              variant="outline"
              onPress={handleNewFolder}
              icon="add"
              style={styles.newFolderButton}
            >
              New Folder
            </Button>
            
            <Button
              variant="primary"
              onPress={handleConfirmSelection}
              disabled={!selectedFolder}
              style={styles.selectButton}
            >
              Select
            </Button>
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
    ...theme.shadows.xl,
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
})
