import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import Toast from 'react-native-toast-message'

import { AppProviders } from '../contexts/AppProviders'
import { toastConfig } from '../components/CustomToast'

/**
 * Root layout component for the entire app
 * This wraps all screens and provides global configuration
 */
export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Slot />
      <Toast config={toastConfig} />
    </AppProviders>
  )
}
