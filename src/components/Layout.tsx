import React, { ReactNode } from 'react'
import { View, ScrollView, StyleSheet, ViewStyle, ScrollViewProps } from 'react-native'

import { theme } from '@utils/theme'
import { SafeAreaWrapper } from './SafeAreaWrapper'

export type ScreenProps = {
  children: ReactNode
  style?: ViewStyle
  backgroundColor?: string
  safeArea?: boolean
  scrollable?: boolean
  scrollViewProps?: ScrollViewProps
  padding?: boolean
}

export type ContainerProps = {
  children: ReactNode
  style?: ViewStyle
  padding?: boolean | 'horizontal' | 'vertical'
  margin?: boolean | 'horizontal' | 'vertical'
  centered?: boolean
  flex?: boolean
}

/**
 * Main Screen component that provides consistent layout structure
 * Handles safe area, scrolling, and background colors
 */
export function Screen({
  children,
  style,
  backgroundColor = theme.colors.background.primary,
  safeArea = true,
  scrollable = false,
  scrollViewProps,
  padding = true,
}: ScreenProps) {
  const screenStyles = [
    styles.screen,
    { backgroundColor },
    padding && styles.screenPadding,
    style,
  ]

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={screenStyles}>{children}</View>
  )

  if (safeArea) {
    return (
      <SafeAreaWrapper backgroundColor={backgroundColor}>
        {scrollable ? <View style={screenStyles}>{content}</View> : content}
      </SafeAreaWrapper>
    )
  }

  return content
}

/**
 * Flexible Container component for layout and spacing
 */
export function Container({
  children,
  style,
  padding = false,
  margin = false,
  centered = false,
  flex = false,
}: ContainerProps) {
  const containerStyles = [
    flex && styles.flex,
    padding === true && styles.padding,
    padding === 'horizontal' && styles.paddingHorizontal,
    padding === 'vertical' && styles.paddingVertical,
    margin === true && styles.margin,
    margin === 'horizontal' && styles.marginHorizontal,
    margin === 'vertical' && styles.marginVertical,
    centered && styles.centered,
    style,
  ]

  return <View style={containerStyles}>{children}</View>
}

/**
 * Row component for horizontal layouts
 */
export function Row({
  children,
  style,
  spacing = 'md',
  align = 'center',
  justify = 'flex-start',
  wrap = false,
}: {
  children: ReactNode
  style?: ViewStyle
  spacing?: keyof typeof theme.spacing
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  wrap?: boolean
}) {
  const rowStyles = [
    styles.row,
    { alignItems: align, justifyContent: justify },
    wrap && styles.wrap,
    style,
  ]

  return (
    <View style={rowStyles}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={index > 0 ? { marginLeft: theme.spacing[spacing] } : undefined}>
          {child}
        </View>
      ))}
    </View>
  )
}

/**
 * Column component for vertical layouts
 */
export function Column({
  children,
  style,
  spacing = 'md',
  align = 'stretch',
  justify = 'flex-start',
}: {
  children: ReactNode
  style?: ViewStyle
  spacing?: keyof typeof theme.spacing
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
}) {
  const columnStyles = [
    styles.column,
    { alignItems: align, justifyContent: justify },
    style,
  ]

  return (
    <View style={columnStyles}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={index > 0 ? { marginTop: theme.spacing[spacing] } : undefined}>
          {child}
        </View>
      ))}
    </View>
  )
}

/**
 * Spacer component for adding space between elements
 */
export function Spacer({
  size = 'md',
  horizontal = false,
}: {
  size?: keyof typeof theme.spacing | number
  horizontal?: boolean
}) {
  const spacerSize = typeof size === 'number' ? size : theme.spacing[size]
  
  return (
    <View
      style={
        horizontal
          ? { width: spacerSize }
          : { height: spacerSize }
      }
    />
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  
  screenPadding: {
    padding: theme.spacing.lg,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  
  flex: {
    flex: 1,
  },
  
  padding: {
    padding: theme.spacing.md,
  },
  
  paddingHorizontal: {
    paddingHorizontal: theme.spacing.md,
  },
  
  paddingVertical: {
    paddingVertical: theme.spacing.md,
  },
  
  margin: {
    margin: theme.spacing.md,
  },
  
  marginHorizontal: {
    marginHorizontal: theme.spacing.md,
  },
  
  marginVertical: {
    marginVertical: theme.spacing.md,
  },
  
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  row: {
    flexDirection: 'row',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  wrap: {
    flexWrap: 'wrap',
  },
})
