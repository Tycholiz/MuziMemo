import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '../utils/theme'

export type SearchHistoryProps = {
  history: string[]
  onHistorySelect: (item: string) => void
  onHistoryRemove: (item: string) => void
  onClearHistory: () => void
  style?: any
}

/**
 * SearchHistory Component
 * Displays recent search terms with selection and removal options
 */
export function SearchHistory({
  history,
  onHistorySelect,
  onHistoryRemove,
  onClearHistory,
  style,
}: SearchHistoryProps) {
  if (history.length === 0) {
    return null
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent searches</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClearHistory}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historyList}>
        {history.map((item, index) => (
          <View key={`${item}-${index}`} style={styles.historyItem}>
            <TouchableOpacity
              style={styles.historyItemContent}
              onPress={() => onHistorySelect(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="time"
                size={16}
                color={theme.colors.text.tertiary}
                style={styles.historyIcon}
              />
              <Text style={styles.historyText} numberOfLines={1}>
                {item}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onHistoryRemove(item)}
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
  historyList: {
    gap: theme.spacing.xs,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  historyItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: theme.spacing.sm,
  },
  historyIcon: {
    marginRight: theme.spacing.sm,
  },
  historyText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
})
