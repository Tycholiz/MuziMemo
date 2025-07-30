import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '../utils/theme'
import { useFileManager } from '../contexts/FileManagerContext'

export type BreadcrumbsProps = {
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
 * A reusable breadcrumb navigation component that uses FileManagerContext
 */
export function Breadcrumbs({ variant = 'default', showHomeIcon = true }: BreadcrumbsProps) {
  const fileManager = useFileManager()

  const isCompact = variant === 'compact'
  const containerStyle = isCompact ? styles.compactContainer : styles.container

  // Build breadcrumb items from current path
  const breadcrumbItems = [
    { name: 'Recordings', path: '', isLast: fileManager.currentPath.length === 0 },
    ...fileManager.currentPath.map((segment, index) => ({
      name: segment,
      path: fileManager.currentPath.slice(0, index + 1).join('/'),
      isLast: index === fileManager.currentPath.length - 1,
    })),
  ]

  const handleBreadcrumbPress = (index: number) => {
    if (index === 0) {
      fileManager.navigateToRoot()
    } else {
      fileManager.navigateToBreadcrumb(index)
    }
  }

  return (
    <View style={containerStyle}>
      {breadcrumbItems.map((breadcrumb, index) => (
        <View key={`${index}-${breadcrumb.path}`} style={styles.breadcrumbItem}>
          <TouchableOpacity
            onPress={() => handleBreadcrumbPress(index)}
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
              color={theme.colors.text.secondary}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    padding: 8,
  },
  compactButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  textLast: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  compactText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.regular,
  },
  compactTextLast: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  separator: {
    marginHorizontal: 4,
  },
})
