import React, { ReactNode } from 'react'
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native'

type SafeAreaWrapperProps = {
  children: ReactNode
  style?: ViewStyle
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
}

/**
 * Safe Area Wrapper component to handle safe area insets consistently
 */
export function SafeAreaWrapper({ children, style }: SafeAreaWrapperProps) {
  return <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
})
