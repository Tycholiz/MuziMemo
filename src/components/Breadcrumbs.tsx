import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system'

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
  /**
   * Directory path to display breadcrumbs for. If not provided, uses FileManagerContext.
   * Should be the full path (e.g., '/path/to/recordings/folder1/folder2')
   */
  directoryPath?: string
  /**
   * Callback when a breadcrumb is pressed. Only used when directoryPath is provided.
   * Receives the full path of the selected breadcrumb.
   */
  onBreadcrumbPress?: (path: string, index: number) => void
}

/**
 * Breadcrumbs Component
 * A reusable breadcrumb navigation component that can use FileManagerContext or accept a directory path
 */
export function Breadcrumbs({
  variant = 'default',
  showHomeIcon = true,
  directoryPath,
  onBreadcrumbPress,
}: BreadcrumbsProps) {
  // Always call useFileManager to follow React hooks rules
  // We'll conditionally use it based on whether directoryPath is provided
  const fileManager = useFileManager()

  const isCompact = variant === 'compact'
  const containerStyle = isCompact ? styles.compactContainer : styles.container

  // Helper function to get recordings directory
  const getRecordingsDirectory = () => {
    const documentsDirectory = FileSystem.documentDirectory
    if (!documentsDirectory) return ''
    return `${documentsDirectory}recordings`
  }

  // Build breadcrumb items from either provided path or FileManager context
  const breadcrumbItems = React.useMemo(() => {
    if (directoryPath) {
      // Use provided directory path
      const recordingsDir = getRecordingsDirectory()
      if (directoryPath === recordingsDir) {
        return [{ name: 'Home', path: recordingsDir, isLast: true }]
      }

      const relativePath = directoryPath.replace(recordingsDir + '/', '')
      const segments = relativePath.split('/').filter(Boolean)

      return [
        { name: 'Home', path: recordingsDir, isLast: false },
        ...segments.map((segment, index) => ({
          name: segment,
          path: `${recordingsDir}/${segments.slice(0, index + 1).join('/')}`,
          isLast: index === segments.length - 1,
        })),
      ]
    } else if (fileManager) {
      // Use FileManager context (existing behavior)
      return [
        { name: 'Home', path: '', isLast: fileManager.currentPath.length === 0 },
        ...fileManager.currentPath.map((segment, index) => ({
          name: segment,
          path: fileManager.currentPath.slice(0, index + 1).join('/'),
          isLast: index === fileManager.currentPath.length - 1,
        })),
      ]
    } else {
      // Fallback when neither directoryPath nor fileManager is available
      return [{ name: 'Home', path: '', isLast: true }]
    }
  }, [directoryPath, fileManager?.currentPath])

  const handleBreadcrumbPress = (index: number) => {
    if (directoryPath && onBreadcrumbPress) {
      // Use provided callback for external path management
      const selectedPath = breadcrumbItems[index]?.path || ''
      onBreadcrumbPress(selectedPath, index)
    } else if (fileManager) {
      // Use FileManager context (existing behavior)
      if (index === 0) {
        fileManager.navigateToRoot()
      } else {
        fileManager.navigateToBreadcrumb(index)
      }
    }
    // If neither directoryPath nor fileManager is available, do nothing
  }

  return (
    <View style={containerStyle} testID="breadcrumb-container">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        testID="breadcrumb-scroll"
      >
        {breadcrumbItems.map((breadcrumb, index) => (
          <View key={`breadcrumb-${index}-${breadcrumb.name}`} style={styles.breadcrumbItem}>
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
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  compactContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
