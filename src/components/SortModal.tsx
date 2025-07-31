import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '../utils/theme'
import { SortOption, SORT_OPTIONS } from '../utils/sortUtils'

export type SortModalProps = {
  visible: boolean
  currentSortOption: SortOption
  onSelectSort: (sortOption: SortOption) => void
  onClose: () => void
}

/**
 * Modal component for selecting sort options
 * Displays a list of available sort options with checkmarks for the selected option
 */
export function SortModal({
  visible,
  currentSortOption,
  onSelectSort,
  onClose,
}: SortModalProps) {
  if (!visible) {
    return null
  }

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
        testID="sort-modal-backdrop"
      >
        <View style={styles.sortModal}>
          <Text style={styles.sortModalTitle}>Sort by</Text>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.sortOption}
              onPress={() => onSelectSort(option.value)}
              activeOpacity={0.7}
            >
              <View style={styles.sortOptionContent}>
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={theme.colors.text.secondary} 
                  style={styles.sortOptionIcon} 
                />
                <Text style={styles.sortOptionText}>{option.label}</Text>
                {currentSortOption === option.value && (
                  <Ionicons 
                    name="checkmark" 
                    size={20} 
                    color={theme.colors.primary} 
                    style={styles.sortCheckmark} 
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  sortModal: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    width: '80%',
    maxWidth: 300,
    ...theme.shadows?.lg,
  },
  sortModalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  sortOption: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  sortOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortOptionIcon: {
    marginRight: theme.spacing.sm,
  },
  sortOptionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
  },
  sortCheckmark: {
    marginLeft: theme.spacing.sm,
  },
})
