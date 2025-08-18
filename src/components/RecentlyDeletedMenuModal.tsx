import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'

export type RecentlyDeletedMenuModalProps = {
  onEmptyRecyclingBin: () => void
  onMultiSelect: () => void
}

type MenuOption = {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
  variant?: 'default' | 'danger'
}

/**
 * RecentlyDeletedMenuModal Component
 * Provides an ellipsis menu for the Recently Deleted screen with "Empty Recycling Bin" option
 */
export function RecentlyDeletedMenuModal({ onEmptyRecyclingBin, onMultiSelect }: RecentlyDeletedMenuModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  const menuOptions: MenuOption[] = [
    {
      id: 'multi-select',
      label: 'Multi-Select',
      icon: 'checkmark-circle-outline',
      onPress: () => {
        setIsVisible(false)
        onMultiSelect()
      },
    },
    {
      id: 'empty-recycling-bin',
      label: 'Empty Recycling Bin',
      icon: 'trash-outline',
      variant: 'danger',
      onPress: () => {
        setIsVisible(false)
        onEmptyRecyclingBin()
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
        testID="recently-deleted-ellipsis-button"
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
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
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
    minWidth: 200,
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  menuIcon: {
    marginRight: theme.spacing.md,
  },
  menuLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  menuLabelDanger: {
    color: theme.colors.error,
  },
})
