import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '../utils/theme'

export type PathDisplayProps = {
  path: string
  style?: any
  textStyle?: any
  iconSize?: number
  iconColor?: string
  numberOfLines?: number
}

/**
 * PathDisplay Component
 * Renders a path string with Ionicons home icon instead of emoji
 */
export function PathDisplay({
  path,
  style,
  textStyle,
  iconSize = 14,
  iconColor = theme.colors.text.secondary,
  numberOfLines = 1,
}: PathDisplayProps) {
  // Split the path into parts and identify home icon placeholder
  const renderPathContent = () => {
    if (!path) return null

    if (path === '[HOME]') {
      return (
        <Ionicons 
          name="home" 
          size={iconSize} 
          color={iconColor} 
          testID="home-icon" 
        />
      )
    }

    if (path.startsWith('[HOME] > ')) {
      const pathAfterHome = path.substring(9) // Remove '[HOME] > '
      return (
        <View style={styles.pathContainer}>
          <Ionicons 
            name="home" 
            size={iconSize} 
            color={iconColor} 
            testID="home-icon" 
          />
          <Text style={[styles.pathText, textStyle]} numberOfLines={numberOfLines}>
            {' > ' + pathAfterHome}
          </Text>
        </View>
      )
    }

    // Fallback for paths without home icon
    return (
      <Text style={[styles.pathText, textStyle]} numberOfLines={numberOfLines}>
        {path}
      </Text>
    )
  }

  return (
    <View style={[styles.container, style]}>
      {renderPathContent()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pathText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    flex: 1,
  },
})
