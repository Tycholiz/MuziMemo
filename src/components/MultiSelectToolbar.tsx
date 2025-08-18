import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '../utils/theme'

export type MultiSelectToolbarProps = {
  selectedCount: number
  onCancel: () => void
  onMove: () => void
  onDelete: () => void
}

/**
 * MultiSelectToolbar Component
 * Appears above breadcrumbs when in multi-select mode
 * Layout: Cancel button (1/3 width) + Move button (1/3 width) + Delete button (1/3 width) with proper margins
 */
export function MultiSelectToolbar({ selectedCount, onCancel, onMove, onDelete }: MultiSelectToolbarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.moveButton, selectedCount === 0 && styles.moveButtonDisabled]}
        onPress={onMove}
        activeOpacity={0.7}
        disabled={selectedCount === 0}
      >
        <Ionicons
          name="arrow-forward"
          size={20}
          color={selectedCount === 0 ? theme.colors.text.secondary : theme.colors.surface.primary}
        />
        <Text style={[styles.moveButtonText, selectedCount === 0 && styles.moveButtonTextDisabled]}>
          Move {selectedCount > 0 ? `(${selectedCount})` : ''}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.deleteButton, selectedCount === 0 && styles.deleteButtonDisabled]}
        onPress={onDelete}
        activeOpacity={0.7}
        disabled={selectedCount === 0}
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color={selectedCount === 0 ? theme.colors.text.secondary : theme.colors.surface.primary}
        />
        <Text style={[styles.deleteButtonText, selectedCount === 0 && styles.deleteButtonTextDisabled]}>
          Delete {selectedCount > 0 ? `(${selectedCount})` : ''}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  moveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.info,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  moveButtonDisabled: {
    backgroundColor: theme.colors.surface.secondary,
  },
  moveButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.surface.primary,
  },
  moveButtonTextDisabled: {
    color: theme.colors.text.secondary,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: theme.colors.surface.secondary,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.surface.primary,
  },
  deleteButtonTextDisabled: {
    color: theme.colors.text.secondary,
  },
})
