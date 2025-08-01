import 'react-native-gesture-handler'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ExpoRoot } from 'expo-router'

/**
 * Main App component that wraps the Expo Router with GestureHandlerRootView
 * This is required for react-native-gesture-handler to work properly
 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ExpoRoot context={require.context('./src/app')} />
    </GestureHandlerRootView>
  )
}
