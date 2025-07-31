import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '../utils/theme'
import type { SearchFilters as SearchFiltersType } from '../utils/searchUtils'

export type SearchFiltersProps = {
  filters: SearchFiltersType
  onFiltersChange: (filters: SearchFiltersType) => void
  style?: any
}

/**
 * SearchFilters Component
 * Provides filter toggles for search results
 */
export function SearchFilters({ filters, onFiltersChange, style }: SearchFiltersProps) {
  const toggleFilter = (filterKey: keyof SearchFiltersType) => {
    onFiltersChange({
      ...filters,
      [filterKey]: !filters[filterKey],
    })
  }

  const FilterToggle = ({
    label,
    icon,
    isActive,
    onPress,
  }: {
    label: string
    icon: string
    isActive: boolean
    onPress: () => void
  }) => (
    <TouchableOpacity
      style={[styles.filterToggle, isActive && styles.filterToggleActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isActive ? 'checkbox' : 'square-outline'}
        size={16}
        color={isActive ? theme.colors.primary : theme.colors.text.tertiary}
        style={styles.filterCheckbox}
      />
      <Ionicons
        name={icon as any}
        size={14}
        color={isActive ? theme.colors.primary : theme.colors.text.tertiary}
        style={styles.filterIcon}
      />
      <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Filter by:</Text>
      
      <View style={styles.filtersRow}>
        <FilterToggle
          label="Audio"
          icon="musical-notes"
          isActive={filters.audio}
          onPress={() => toggleFilter('audio')}
        />
        
        <FilterToggle
          label="Folders"
          icon="folder"
          isActive={filters.folders}
          onPress={() => toggleFilter('folders')}
        />
        
        <FilterToggle
          label="Text"
          icon="document-text"
          isActive={filters.text}
          onPress={() => toggleFilter('text')}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  filterToggleActive: {
    backgroundColor: theme.colors.primary + '15', // 15% opacity
    borderColor: theme.colors.primary + '40', // 40% opacity
  },
  filterCheckbox: {
    marginRight: theme.spacing.xs,
  },
  filterIcon: {
    marginRight: theme.spacing.xs,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
  },
  filterLabelActive: {
    color: theme.colors.primary,
  },
})
