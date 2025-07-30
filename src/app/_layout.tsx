import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { AppProviders } from '../contexts/AppProviders'

/**
 * Root layout component for the entire app
 * This wraps all screens and provides global configuration
 */
export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Slot />
    </AppProviders>
  )
}
