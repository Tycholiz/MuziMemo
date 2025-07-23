/**
 * Color constants for the app
 */

export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',

  // Grays
  black: '#000000',
  darkGray: '#1C1C1E',
  gray: '#8E8E93',
  lightGray: '#C6C6C8',
  extraLightGray: '#F2F2F7',
  white: '#FFFFFF',

  // Background
  background: '#FFFFFF',
  secondaryBackground: '#F2F2F7',

  // Text
  primaryText: '#000000',
  secondaryText: '#8E8E93',

  // Tab bar
  tabBarActive: '#007AFF',
  tabBarInactive: '#8E8E93',
  tabBarBackground: '#F2F2F7',
} as const

export type ColorKey = keyof typeof COLORS
