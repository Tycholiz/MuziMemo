import React, { useState, useEffect } from 'react'
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '../utils/theme'

export type CreateFolderModalProps = {
  visible: boolean
  onClose: () => void
  onCreateFolder: (folderName: string) => Promise<void>
  currentPath: string
}

export function CreateFolderModal({ visible, onClose, onCreateFolder, currentPath }: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setFolderName('')
      setIsCreating(false)
    }
  }, [visible])

  const handleCreate = async () => {
    const trimmedName = folderName.trim()

    if (!trimmedName) {
      Alert.alert('Invalid Name', 'Please enter a folder name')
      return
    }

    // Basic validation for folder names
    if (trimmedName.includes('/') || trimmedName.includes('\\')) {
      Alert.alert('Invalid Name', 'Folder names cannot contain / or \\ characters')
      return
    }

    try {
      setIsCreating(true)
      await onCreateFolder(trimmedName)
      onClose()
    } catch (error) {
      console.error('Failed to create folder:', error)
      Alert.alert('Error', 'Failed to create folder. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    if (!isCreating) {
      onClose()
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>New Folder</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel} disabled={isCreating}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.pathLabel}>Creating in:</Text>
            <Text style={styles.pathText}>{currentPath ? `Recordings/${currentPath}` : 'Recordings'}</Text>

            <Text style={styles.inputLabel}>Folder Name</Text>
            <TextInput
              style={styles.input}
              value={folderName}
              onChangeText={setFolderName}
              placeholder="Enter folder name"
              placeholderTextColor={theme.colors.text.secondary}
              autoFocus
              editable={!isCreating}
              onSubmitEditing={handleCreate}
              returnKeyType="done"
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel} disabled={isCreating}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.createButton, isCreating && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={isCreating || !folderName.trim()}
            >
              <Text style={[styles.createButtonText, isCreating && styles.buttonTextDisabled]}>
                {isCreating ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  pathLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  pathText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.primary,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.medium,
    color: 'white',
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
})
