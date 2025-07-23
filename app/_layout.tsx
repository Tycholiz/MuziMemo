import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { ErrorBoundary } from '@components/ErrorBoundary'

/**
 * Root layout component for the entire app
 * This wraps all screens and provides global configuration
 */
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ErrorBoundary>
  )
}
