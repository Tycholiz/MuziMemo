import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'

export type DropdownOption = {
  label: string
  value: string
  icon?: keyof typeof Ionicons.glyphMap
  subtitle?: string
}

export type DropdownProps = {
  label?: string
  value: string
  options: DropdownOption[]
  onSelect: (option: DropdownOption) => void
  placeholder?: string
  disabled?: boolean
  icon?: keyof typeof Ionicons.glyphMap
}

/**
 * Dropdown component for selecting from a list of options
 * Matches the design from the RecordScreen mockup
 */
export function Dropdown({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select...',
  disabled = false,
  icon,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find(option => option.value === value)

  const handleSelect = (option: DropdownOption) => {
    onSelect(option)
    setIsOpen(false)
  }

  const renderOption = ({ item }: { item: DropdownOption }) => {
    const isSelected = item.value === value

    return (
      <TouchableOpacity style={styles.option} onPress={() => handleSelect(item)} activeOpacity={0.7}>
        <View style={styles.optionContent}>
          {item.icon && (
            <Ionicons name={item.icon} size={20} color={theme.colors.text.secondary} style={styles.optionIcon} />
          )}
          <View style={styles.optionText}>
            <Text style={[styles.optionLabel, isSelected && styles.selectedOptionLabel]}>{item.label}</Text>
            {item.subtitle && <Text style={styles.optionSubtitle}>{item.subtitle}</Text>}
          </View>
          {isSelected && <Ionicons name="checkmark" size={20} color={theme.colors.primary} style={styles.checkmark} />}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.dropdown, disabled && styles.disabled]}
        onPress={() => !disabled && setIsOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownContent}>
          {icon && <Ionicons name={icon} size={20} color={theme.colors.text.secondary} style={styles.dropdownIcon} />}
          <Text style={styles.dropdownText}>{selectedOption?.label || placeholder}</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={theme.colors.text.tertiary} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View style={styles.modal}>
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={item => item.value}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
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

  dropdown: {
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

  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  dropdownIcon: {
    marginRight: theme.spacing.sm,
  },

  dropdownText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modal: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    maxHeight: '60%',
    width: '80%',
    maxWidth: 300,
    ...theme.shadows.lg,
  },

  optionsList: {
    maxHeight: 300,
  },

  option: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionIcon: {
    marginRight: theme.spacing.sm,
  },

  optionText: {
    flex: 1,
  },

  optionLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  selectedOptionLabel: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },

  optionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },

  checkmark: {
    marginLeft: theme.spacing.sm,
  },
})
