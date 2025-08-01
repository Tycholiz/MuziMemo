import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '../utils/theme'
import type { RecentSearchItem } from '../hooks/useSearch'

export type RecentSearchesProps = {
  recentSearches: RecentSearchItem[]
  onRecentSearchSelect: (item: RecentSearchItem) => void
  onRecentSearchRemove: (item: RecentSearchItem) => void
  onClearRecentSearches: () => void
  style?: any
}

/**
 * RecentSearches Component
 * Displays recently clicked files/folders with selection and removal options
 */
export function RecentSearches({
  recentSearches,
  onRecentSearchSelect,
  onRecentSearchRemove,
  onClearRecentSearches,
  style,
}: RecentSearchesProps) {
  if (recentSearches.length === 0) {
    return null
  }

  const getIcon = (type: 'audio' | 'folder') => {
    return type === 'audio' ? 'musical-notes' : 'folder'
  }

  const formatPath = (relativePath: string) => {
    // Remove leading slash and limit length
    const cleanPath = relativePath.replace(/^\/+/, '')
    return cleanPath.length > 30 ? `...${cleanPath.slice(-27)}` : cleanPath
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClearRecentSearches}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentList}>
        {recentSearches.map((item, index) => (
          <View key={`${item.id}-${item.type}-${index}`} style={styles.recentItem}>
            <TouchableOpacity
              style={styles.recentItemContent}
              onPress={() => onRecentSearchSelect(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={getIcon(item.type)}
                size={16}
                color={theme.colors.text.tertiary}
                style={styles.recentIcon}
              />
              <View style={styles.recentInfo}>
                <Text style={styles.recentName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.recentPath} numberOfLines={1}>
                  {formatPath(item.relativePath)}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRecentSearchRemove(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close"
                size={14}
                color={theme.colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>
        ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  clearButton: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  clearButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  recentList: {
    gap: theme.spacing.xs,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  recentItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: theme.spacing.sm,
  },
  recentIcon: {
    marginRight: theme.spacing.sm,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  recentPath: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
})
