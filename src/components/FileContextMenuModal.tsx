import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'

export type FileContextMenuModalProps = {
  onRename: () => void
  onMove: () => void
  onDelete: () => void
}

type MenuOption = {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
  variant?: 'default' | 'danger'
}

/**
 * FileContextMenuModal Component
 * Provides an ellipsis menu with file management options (rename, move, delete)
 */
export function FileContextMenuModal({ onRename, onMove, onDelete }: FileContextMenuModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  const menuOptions: MenuOption[] = [
    {
      id: 'rename',
      label: 'Rename',
      icon: 'pencil-outline',
      onPress: () => {
        setIsVisible(false)
        onRename()
      },
    },
    {
      id: 'move',
      label: 'Move',
      icon: 'folder-outline',
      onPress: () => {
        setIsVisible(false)
        onMove()
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash-outline',
      variant: 'danger',
      onPress: () => {
        setIsVisible(false)
        onDelete()
      },
    },
  ]

  const handleEllipsisPress = () => {
    setIsVisible(true)
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  const renderMenuItem = (option: MenuOption) => (
    <TouchableOpacity key={option.id} style={styles.menuItem} onPress={option.onPress} activeOpacity={0.7}>
      <Ionicons
        name={option.icon}
        size={20}
        color={option.variant === 'danger' ? theme.colors.error : theme.colors.text.secondary}
        style={styles.menuIcon}
      />
      <Text style={[styles.menuLabel, option.variant === 'danger' && styles.menuLabelDanger]}>{option.label}</Text>
    </TouchableOpacity>
  )

  return (
    <>
      <TouchableOpacity
        style={styles.ellipsisButton}
        onPress={handleEllipsisPress}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text.tertiary} />
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="fade" onRequestClose={handleClose}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
          <View style={styles.menu}>{menuOptions.map(renderMenuItem)}</View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  ellipsisButton: {
    padding: theme.spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  menuIcon: {
    marginRight: theme.spacing.sm,
  },
  menuLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  menuLabelDanger: {
    color: theme.colors.error,
  },
})
