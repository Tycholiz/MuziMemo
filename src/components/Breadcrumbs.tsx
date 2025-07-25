import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'
import type { BreadcrumbItem } from '../customTypes/FileSystem'

export type BreadcrumbsProps = {
  /**
   * Array of breadcrumb items to display
   */
  breadcrumbs: BreadcrumbItem[]
  /**
   * Callback when a breadcrumb is pressed
   * @param path - The path of the breadcrumb that was pressed
   * @param index - The index of the breadcrumb in the array
   */
  onBreadcrumbPress: (path: string, index: number) => void
  /**
   * Callback when the home icon is pressed
   */
  onHomePress?: () => void
  /**
   * Visual variant of the breadcrumbs
   * - 'default': Standard breadcrumbs with home icon
   * - 'compact': More compact version for modals/dialogs
   */
  variant?: 'default' | 'compact'
  /**
   * Whether to show the home icon as the first breadcrumb
   */
  showHomeIcon?: boolean
}

/**
 * Breadcrumbs Component
 * A reusable breadcrumb navigation component that can be used across the app
 */
export function Breadcrumbs({
  breadcrumbs,
  onBreadcrumbPress,
  onHomePress,
  variant = 'default',
  showHomeIcon = true,
}: BreadcrumbsProps) {
  const handleBreadcrumbPress = (breadcrumb: BreadcrumbItem, index: number) => {
    onBreadcrumbPress(breadcrumb.path, index)
  }

  const handleHomePress = () => {
    if (onHomePress) {
      onHomePress()
    } else {
      // Default behavior: navigate to first breadcrumb (root)
      if (breadcrumbs.length > 0) {
        onBreadcrumbPress(breadcrumbs[0].path, 0)
      }
    }
  }

  const isCompact = variant === 'compact'
  const containerStyle = isCompact ? styles.compactContainer : styles.container

  return (
    <View style={containerStyle}>
      {breadcrumbs.map((breadcrumb, index) => (
        <View key={breadcrumb.path} style={styles.breadcrumbItem}>
          <TouchableOpacity
            onPress={() => (index === 0 && showHomeIcon ? handleHomePress() : handleBreadcrumbPress(breadcrumb, index))}
            style={isCompact ? styles.compactButton : styles.button}
          >
            {index === 0 && showHomeIcon ? (
              <Ionicons
                name="home"
                size={isCompact ? 14 : 16}
                color={breadcrumb.isLast ? theme.colors.text.primary : theme.colors.text.secondary}
              />
            ) : (
              <Text
                style={[
                  isCompact ? styles.compactText : styles.text,
                  breadcrumb.isLast && (isCompact ? styles.compactTextLast : styles.textLast),
                ]}
              >
                {breadcrumb.name}
              </Text>
            )}
          </TouchableOpacity>
          {!breadcrumb.isLast && (
            <Ionicons
              name="chevron-forward"
              size={isCompact ? 14 : 16}
              color={theme.colors.text.tertiary}
              style={styles.separator}
            />
          )}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    padding: theme.spacing.xs,
  },
  compactButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  text: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  textLast: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  compactText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  compactTextLast: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  separator: {
    marginHorizontal: theme.spacing.xs,
  },
})
