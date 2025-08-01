import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import Toast from 'react-native-toast-message'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { AppProviders } from '../contexts/AppProviders'
import { toastConfig } from '../components/CustomToast'

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
