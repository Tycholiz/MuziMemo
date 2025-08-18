import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View, Platform } from 'react-native'

import { AppProviders } from '../contexts/AppProviders'
import { toastConfig } from '../components/CustomToast'

// Conditionally import Toast with web fallback
let Toast: any = null

if (Platform.OS !== 'web') {
  try {
    Toast = require('react-native-toast-message').default
  } catch (error) {
    console.warn('react-native-toast-message not available:', error)
  }
} else {
  // Web fallback for Toast
  Toast = {
    show: (_options: any) => {
      // Web fallback - could implement web toast here
      console.log('Toast not available on web')
    },
    hide: () => {},
  }
}

// Conditionally import GestureHandlerRootView only on native platforms
let GestureHandlerRootView: any = View

if (Platform.OS !== 'web') {
  try {
    const gestureHandler = require('react-native-gesture-handler')
    GestureHandlerRootView = gestureHandler.GestureHandlerRootView
  } catch (error) {
    console.warn('react-native-gesture-handler not available:', error)
  }
}

/**
 * Root layout component for the entire app
 * This wraps all screens and provides global configuration
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AppProviders>
        <StatusBar style="auto" />
        <Slot />
        {Toast && <Toast config={toastConfig} />}
      </AppProviders>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
