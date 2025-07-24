import React, { ReactNode } from 'react'
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native'

import { theme } from '@utils/theme'

type SafeAreaWrapperProps = {
  children: ReactNode
  style?: ViewStyle
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
  backgroundColor?: string
}

/**
 * Safe Area Wrapper component to handle safe area insets consistently
 * Updated for dark theme
 */
export function SafeAreaWrapper({
  children,
  style,
  backgroundColor = theme.colors.background.primary,
}: SafeAreaWrapperProps) {
  return <SafeAreaView style={[styles.container, { backgroundColor }, style]}>{children}</SafeAreaView>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
