import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import Toast from 'react-native-toast-message'
import { StyleSheet, View, Platform } from 'react-native'

import { AppProviders } from '../contexts/AppProviders'
import { toastConfig } from '../components/CustomToast'

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
        <Toast config={toastConfig} />
      </AppProviders>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
