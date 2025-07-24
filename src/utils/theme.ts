/**
 * Theme configuration for MuziMemo app
 * Contains colors, typography, spacing, and other design tokens
 */

export const theme = {
  colors: {
    // Primary colors (Red accent from mockup)
    primary: '#FF3B30',
    primaryLight: '#FF6B60',
    primaryDark: '#D70015',

    // Secondary colors
    secondary: '#007AFF',
    secondaryLight: '#4DA6FF',
    secondaryDark: '#0051D5',

    // Status colors
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5AC8FA',

    // Dark theme colors (from mockup)
    black: '#000000',
    white: '#FFFFFF',
    gray: {
      50: '#F8F9FA',
      100: '#F1F3F4',
      200: '#E8EAED',
      300: '#DADCE0',
      400: '#9AA0A6',
      500: '#5F6368',
      600: '#3C4043',
      700: '#2D2F31', // Card backgrounds
      800: '#1F2124', // Secondary backgrounds
      900: '#131416', // Primary dark background
      950: '#0A0B0C', // Deepest background
    },

    // Background colors (Dark theme)
    background: {
      primary: '#131416', // Main dark background
      secondary: '#1F2124', // Secondary dark background
      tertiary: '#2D2F31', // Card/elevated surfaces
      elevated: '#3C4043', // Elevated components
    },

    // Text colors (Dark theme)
    text: {
      primary: '#FFFFFF', // Primary white text
      secondary: '#E8EAED', // Secondary light text
      tertiary: '#9AA0A6', // Tertiary muted text
      disabled: '#5F6368', // Disabled text
      inverse: '#131416', // Dark text on light backgrounds
    },

    // Border colors (Dark theme)
    border: {
      light: '#3C4043',
      medium: '#5F6368',
      dark: '#9AA0A6',
    },

    // Tab bar colors (Dark theme)
    tabBar: {
      active: '#FF3B30',
      inactive: '#9AA0A6',
      background: '#131416',
      border: '#2D2F31',
    },

    // Surface colors for cards and components
    surface: {
      primary: '#2D2F31',
      secondary: '#3C4043',
      tertiary: '#5F6368',
    },
  },

  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
} as const

export type Theme = typeof theme
export type ThemeColors = typeof theme.colors
